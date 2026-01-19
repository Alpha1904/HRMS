import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePerformanceEvaluationDto } from '../dto/create-performance-evaluation.dto';
import { QueryEvaluationDto } from '../dto/query-evaluation.dto';
import { AuditContext, PerformanceAuditService } from './performance-audit.service';
import { EvaluationStatus, Role } from '@prisma/client';

@Injectable()
export class PerformanceEvaluationsService {
  constructor(private prisma: PrismaService, private audit: PerformanceAuditService) {}

  async createEvaluation(dto: CreatePerformanceEvaluationDto, ctx: AuditContext, currentUser: { role: Role; tenantId?: string }) {
    if (dto.tenantId && currentUser.tenantId && dto.tenantId !== currentUser.tenantId) {
      throw new ForbiddenException('Cross-tenant create denied');
    }

    const employee = await this.prisma.profile.findFirst({
      where: { id: dto.employeeId, deletedAt: null, isTerminated: false },
      include: { user: { select: { tenantId: true } } },
    });
    if (!employee) throw new NotFoundException('Employee profile not found');

    const cycle = await this.prisma.evaluationCycle.findUnique({ where: { id: dto.cycleId } });
    if (!cycle || cycle.deletedAt) throw new NotFoundException('Cycle not found');

    const tenantId = currentUser.tenantId ?? dto.tenantId ?? employee.user.tenantId ?? cycle.tenantId;

    try {
      const created = await this.prisma.performanceEvaluation.create({
        data: {
          employeeId: dto.employeeId,
          cycleId: dto.cycleId,
          tenantId,
        },
      });

      await this.audit.log(ctx, 'CREATE_EVALUATION', 'PerformanceEvaluation', created.id, undefined, created);

      return created;
    } catch (e: any) {
      throw new ConflictException('Duplicate evaluation for employee and cycle');
    }
  }

  async initializeEvaluationsForCycle(cycleId: number, ctx: AuditContext, currentUser: { tenantId?: string }) {
    const cycle = await this.prisma.evaluationCycle.findUnique({ where: { id: cycleId } });
    if (!cycle || cycle.deletedAt) throw new NotFoundException('Cycle not found');

    if (currentUser.tenantId && cycle.tenantId && currentUser.tenantId !== cycle.tenantId) {
      throw new ForbiddenException('Cross-tenant initialize denied');
    }

    const employees = await this.prisma.profile.findMany({
      where: { deletedAt: null, isTerminated: false, user: { isActive: true } },
      select: { id: true, user: { select: { tenantId: true } } },
    });

    const tenantId = cycle.tenantId ?? currentUser.tenantId;

    const created = await this.prisma.performanceEvaluation.createMany({
      data: employees.map((p) => ({
        employeeId: p.id,
        cycleId,
        tenantId: tenantId ?? p.user.tenantId ?? undefined,
      })),
      skipDuplicates: true,
    });

    await this.audit.log(ctx, 'INITIALIZE_EVALUATIONS', 'EvaluationCycle', cycleId, undefined, {
      count: created.count,
    });

    return { message: `Initialized ${created.count} evaluations for cycle ${cycleId}`, count: created.count };
  }

  async getEvaluations(query: QueryEvaluationDto, currentUser: { role: Role; id: number; tenantId?: string; profile?: { id: number; department?: string } }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (currentUser.tenantId) where.tenantId = currentUser.tenantId;

    if (query.cycleId) where.cycleId = query.cycleId;
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.status?.length) where.status = { in: query.status };

    if (query.department) where.employee = { department: query.department };

    if (currentUser.role === Role.EMPLOYEE) {
      const profile = await this.prisma.profile.findUnique({ where: { userId: currentUser.id }, select: { id: true } });
      if (!profile) throw new ForbiddenException('User profile not found');
      where.employeeId = profile.id;
    }

    if (currentUser.role === Role.MANAGER) {
      let dept = currentUser.profile?.department;
      if (!dept) {
        const profile = await this.prisma.profile.findUnique({ where: { userId: currentUser.id }, select: { department: true } });
        dept = profile?.department ?? undefined;
      }
      if (dept) where.employee = { ...(where.employee ?? {}), department: dept };
    }

    const orderBy: any = { createdAt: 'desc' };
    if (query.sortBy) {
      const dir = query.sortOrder ?? 'desc';
      const allowed = ['createdAt', 'updatedAt', 'finalScore', 'status'];
      if (allowed.includes(query.sortBy)) {
        orderBy[query.sortBy] = dir;
      }
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.performanceEvaluation.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          employee: { select: { id: true, fullName: true, department: true, managerId: true, userId: true } },
          cycle: true,
        },
      }),
      this.prisma.performanceEvaluation.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEvaluationById(id: number, currentUser: { tenantId?: string }) {
    const evaluation = await this.prisma.performanceEvaluation.findUnique({
      where: { id },
      include: {
        employee: true,
        cycle: true,
        automaticScore: true,
        manualReview: true,
        selfReview: true,
        objectives: { include: { progress: { include: { updatedBy: true } } } },
      },
    });

    if (!evaluation) throw new NotFoundException('Evaluation not found');

    if (currentUser.tenantId && evaluation.tenantId && currentUser.tenantId !== evaluation.tenantId) {
      throw new ForbiddenException('Cross-tenant read denied');
    }

    return evaluation;
  }

  async getEmployeeEvaluation(employeeId: number, cycleId: number, currentUser: { tenantId?: string }) {
    const evaluation = await this.prisma.performanceEvaluation.findUnique({
      where: { employeeId_cycleId: { employeeId, cycleId } },
      include: {
        employee: true,
        cycle: true,
        automaticScore: true,
        manualReview: true,
        selfReview: true,
        objectives: { include: { progress: true } },
      },
    });

    if (!evaluation) throw new NotFoundException('Evaluation not found');

    if (currentUser.tenantId && evaluation.tenantId && currentUser.tenantId !== evaluation.tenantId) {
      throw new ForbiddenException('Cross-tenant read denied');
    }

    return evaluation;
  }

  async updateEvaluationStatus(id: number, status: EvaluationStatus, ctx: AuditContext, currentUser: { tenantId?: string }) {
    const evaluation = await this.prisma.performanceEvaluation.findUnique({
      where: { id },
      include: { cycle: true, automaticScore: true },
    });
    if (!evaluation) throw new NotFoundException('Evaluation not found');

    if (currentUser.tenantId && evaluation.tenantId && currentUser.tenantId !== evaluation.tenantId) {
      throw new ForbiddenException('Cross-tenant update denied');
    }

    if (status === EvaluationStatus.COMPLETED) {
      if (!evaluation.automaticScore) {
        throw new BadRequestException('Automatic score is required before completing');
      }
      if (evaluation.finalScore === null || evaluation.finalScore === undefined) {
        throw new BadRequestException('Final score is required before completing');
      }
    }

    if (status === EvaluationStatus.ARCHIVED) {
      if (new Date() < evaluation.cycle.endDate) {
        throw new BadRequestException('Cannot archive before cycle ends');
      }
    }

    const updated = await this.prisma.performanceEvaluation.update({
      where: { id },
      data: { status },
    });

    await this.audit.log(ctx, 'UPDATE_EVALUATION_STATUS', 'PerformanceEvaluation', id, evaluation, updated);

    return updated;
  }

  async calculateFinalScore(id: number, ctx: AuditContext, currentUser: { tenantId?: string }) {
    const evaluation = await this.prisma.performanceEvaluation.findUnique({
      where: { id },
      include: { automaticScore: true, manualReview: true, selfReview: true },
    });

    if (!evaluation) throw new NotFoundException('Evaluation not found');

    if (currentUser.tenantId && evaluation.tenantId && currentUser.tenantId !== evaluation.tenantId) {
      throw new ForbiddenException('Cross-tenant calculate denied');
    }

    if (!evaluation.automaticScore) {
      throw new BadRequestException('Automatic score is required');
    }

    const automaticScore = evaluation.automaticScore.totalScore;
    const manualScore = evaluation.manualReview?.score ?? 0;
    const selfScore = evaluation.selfReview?.selfScore ?? 0;

    const finalScore = automaticScore * 0.6 + manualScore * 0.3 + selfScore * 0.1;

    const updated = await this.prisma.performanceEvaluation.update({
      where: { id },
      data: { finalScore },
    });

    await this.audit.log(ctx, 'CALCULATE_FINAL_SCORE', 'PerformanceEvaluation', id, evaluation, updated);

    return {
      evaluationId: id,
      automaticScore,
      manualScore: evaluation.manualReview?.score ?? null,
      selfScore: evaluation.selfReview?.selfScore ?? null,
      finalScore,
      formula: `(${automaticScore} * 0.6) + (${manualScore} * 0.3) + (${selfScore} * 0.1)`,
    };
  }

  async deleteEvaluation(id: number, ctx: AuditContext, currentUser: { tenantId?: string }) {
    const evaluation = await this.prisma.performanceEvaluation.findUnique({ where: { id } });
    if (!evaluation) throw new NotFoundException('Evaluation not found');

    if (currentUser.tenantId && evaluation.tenantId && currentUser.tenantId !== evaluation.tenantId) {
      throw new ForbiddenException('Cross-tenant delete denied');
    }

    await this.prisma.performanceEvaluation.delete({ where: { id } });
    await this.audit.log(ctx, 'DELETE_EVALUATION', 'PerformanceEvaluation', id, evaluation, undefined);

    return { message: `Evaluation ${id} deleted` };
  }
}
