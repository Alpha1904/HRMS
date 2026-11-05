import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditContext, PerformanceAuditService } from './performance-audit.service';

@Injectable()
export class RankingService {
  constructor(private prisma: PrismaService, private audit: PerformanceAuditService) {}

  async rankEmployeesByCycle(cycleId: number, ctx: AuditContext, currentUser: { tenantId?: string }) {
    const cycle = await this.prisma.evaluationCycle.findUnique({ where: { id: cycleId } });
    if (!cycle || cycle.deletedAt) throw new NotFoundException('Cycle not found');

    if (currentUser.tenantId && cycle.tenantId && currentUser.tenantId !== cycle.tenantId) {
      throw new ForbiddenException('Cross-tenant rank denied');
    }

    const evaluations = await this.prisma.performanceEvaluation.findMany({
      where: { cycleId, status: 'COMPLETED', finalScore: { not: null } },
      orderBy: [{ finalScore: 'desc' }, { id: 'asc' }],
      select: { id: true, finalScore: true },
    });

    if (evaluations.length === 0) {
      throw new BadRequestException('No completed evaluations with finalScore found');
    }

    let rank = 0;
    let prevScore: number | null = null;
    let position = 0;

    const updates: { id: number; rank: number }[] = [];

    for (const e of evaluations) {
      position++;
      const score = e.finalScore ?? null;
      if (prevScore === null || score !== prevScore) {
        rank = position;
        prevScore = score;
      }
      updates.push({ id: e.id, rank });
    }

    await this.prisma.$transaction(async (tx) => {
      for (const u of updates) {
        await tx.performanceEvaluation.update({ where: { id: u.id }, data: { rank: u.rank } });
      }
    });

    await this.audit.log(ctx, 'CALCULATE_RANKINGS', 'EvaluationCycle', cycleId, undefined, { count: updates.length });

    return { message: `Ranked ${updates.length} evaluations for cycle ${cycleId}`, count: updates.length };
  }

  async getRankings(cycleId: number, query: { page?: number; limit?: number; department?: string }, currentUser: { tenantId?: string }) {
    const cycle = await this.prisma.evaluationCycle.findUnique({ where: { id: cycleId } });
    if (!cycle || cycle.deletedAt) throw new NotFoundException('Cycle not found');

    if (currentUser.tenantId && cycle.tenantId && currentUser.tenantId !== cycle.tenantId) {
      throw new ForbiddenException('Cross-tenant read denied');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { cycleId, status: 'COMPLETED', finalScore: { not: null } };
    if (query.department) where.employee = { department: query.department };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.performanceEvaluation.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ rank: 'asc' }, { finalScore: 'desc' }],
        include: { employee: { select: { id: true, fullName: true, department: true } } },
      }),
      this.prisma.performanceEvaluation.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getEmployeeRank(employeeId: number, cycleId: number, currentUser: { tenantId?: string }) {
    const evalRow = await this.prisma.performanceEvaluation.findUnique({
      where: { employeeId_cycleId: { employeeId, cycleId } },
      select: { rank: true, finalScore: true, status: true, tenantId: true },
    });

    if (!evalRow) throw new NotFoundException('Evaluation not found');

    if (currentUser.tenantId && evalRow.tenantId && currentUser.tenantId !== evalRow.tenantId) {
      throw new ForbiddenException('Cross-tenant read denied');
    }

    if (evalRow.status !== 'COMPLETED' || evalRow.finalScore === null || evalRow.rank === null) {
      throw new BadRequestException('Rank is only available for completed evaluations');
    }

    const totalEmployees = await this.prisma.performanceEvaluation.count({
      where: { cycleId, status: 'COMPLETED', finalScore: { not: null } },
    });

    const percentile = ((totalEmployees - evalRow.rank + 1) / totalEmployees) * 100;

    return {
      employeeId,
      cycleId,
      rank: evalRow.rank,
      percentile,
      totalEmployees,
    };
  }
}
