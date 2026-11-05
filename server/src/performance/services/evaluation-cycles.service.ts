import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEvaluationCycleDto } from '../dto/create-evaluation-cycle.dto';
import { UpdateEvaluationCycleDto } from '../dto/update-evaluation-cycle.dto';
import { NotificationService } from '../../notification/notification.service';
import { AuditContext, PerformanceAuditService } from './performance-audit.service';
import { EvaluationPeriod, Role } from '@prisma/client';

@Injectable()
export class EvaluationCyclesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
    private audit: PerformanceAuditService,
  ) {}

  private parseAndValidateDates(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: [{ field: 'startDate/endDate', message: 'Invalid ISO date' }],
      });
    }
    if (end <= start) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: [{ field: 'endDate', message: 'End date must be after start date' }],
      });
    }
    return { start, end };
  }

  async createCycle(dto: CreateEvaluationCycleDto, ctx: AuditContext, currentUser: { role: Role; tenantId?: string }) {
    if (dto.tenantId && currentUser.tenantId && dto.tenantId !== currentUser.tenantId) {
      throw new ForbiddenException('Cross-tenant create denied');
    }

    const { start, end } = this.parseAndValidateDates(dto.startDate, dto.endDate);

    const created = await this.prisma.evaluationCycle.create({
      data: {
        name: dto.name,
        period: dto.period,
        startDate: start,
        endDate: end,
        isActive: true,
        tenantId: currentUser.tenantId ?? dto.tenantId,
      },
    });

    await this.audit.log(ctx, 'CREATE_CYCLE', 'EvaluationCycle', created.id, undefined, created);

    return created;
  }

  async updateCycle(
    id: number,
    dto: UpdateEvaluationCycleDto,
    ctx: AuditContext,
    currentUser: { role: Role; tenantId?: string },
  ) {
    const existing = await this.prisma.evaluationCycle.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Cycle not found');
    }

    if (currentUser.tenantId && existing.tenantId && currentUser.tenantId !== existing.tenantId) {
      throw new ForbiddenException('Cross-tenant update denied');
    }

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (dto.startDate || dto.endDate) {
      const { start, end } = this.parseAndValidateDates(
        dto.startDate ?? existing.startDate.toISOString(),
        dto.endDate ?? existing.endDate.toISOString(),
      );
      startDate = start;
      endDate = end;
    }

    const updated = await this.prisma.evaluationCycle.update({
      where: { id },
      data: {
        name: dto.name,
        period: dto.period,
        startDate,
        endDate,
        tenantId: dto.tenantId,
      },
    });

    await this.audit.log(ctx, 'UPDATE_CYCLE', 'EvaluationCycle', id, existing, updated);

    return updated;
  }

  async activateCycle(id: number, ctx: AuditContext, currentUser: { tenantId?: string }) {
    const cycle = await this.prisma.evaluationCycle.findUnique({ where: { id } });
    if (!cycle || cycle.deletedAt) {
      throw new NotFoundException('Cycle not found');
    }

    if (currentUser.tenantId && cycle.tenantId && currentUser.tenantId !== cycle.tenantId) {
      throw new ForbiddenException('Cross-tenant activate denied');
    }

    await this.prisma.$transaction(async (tx) => {
      const whereSamePeriod: any = {
        period: cycle.period,
        deletedAt: null,
      };
      if (cycle.tenantId) {
        whereSamePeriod.tenantId = cycle.tenantId;
      }

      await tx.evaluationCycle.updateMany({
        where: { ...whereSamePeriod, isActive: true },
        data: { isActive: false },
      });

      await tx.evaluationCycle.update({
        where: { id },
        data: { isActive: true },
      });
    });

    await this.audit.log(ctx, 'ACTIVATE_CYCLE', 'EvaluationCycle', id, undefined, { isActive: true });

    await this.notifyCycleStart(cycle.period, cycle.tenantId);

    return { message: `Cycle ${id} activated` };
  }

  async deactivateCycle(id: number, ctx: AuditContext, currentUser: { tenantId?: string }) {
    const cycle = await this.prisma.evaluationCycle.findUnique({ where: { id } });
    if (!cycle || cycle.deletedAt) {
      throw new NotFoundException('Cycle not found');
    }

    if (currentUser.tenantId && cycle.tenantId && currentUser.tenantId !== cycle.tenantId) {
      throw new ForbiddenException('Cross-tenant deactivate denied');
    }

    const updated = await this.prisma.evaluationCycle.update({
      where: { id },
      data: { isActive: false },
    });

    await this.audit.log(ctx, 'DEACTIVATE_CYCLE', 'EvaluationCycle', id, cycle, updated);

    return { message: `Cycle ${id} deactivated` };
  }

  async getCycles(query: { page?: number; limit?: number; period?: EvaluationPeriod; isActive?: boolean }, currentUser: { role: Role; tenantId?: string; profile?: { department?: string } }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (query.period) where.period = query.period;
    if (typeof query.isActive === 'boolean') where.isActive = query.isActive;

    if (currentUser.tenantId) where.tenantId = currentUser.tenantId;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.evaluationCycle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.evaluationCycle.count({ where }),
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

  async getCycleById(id: number, currentUser: { role: Role; tenantId?: string; profile?: { department?: string } }) {
    const cycle = await this.prisma.evaluationCycle.findUnique({
      where: { id },
      include: {
        _count: {
          select: { evaluations: true },
        },
      },
    });

    if (!cycle || cycle.deletedAt) {
      throw new NotFoundException('Cycle not found');
    }

    if (currentUser.tenantId && cycle.tenantId && currentUser.tenantId !== cycle.tenantId) {
      throw new ForbiddenException('Cross-tenant read denied');
    }

    if (currentUser.role === Role.MANAGER && currentUser.profile?.department) {
      const deptCount = await this.prisma.performanceEvaluation.count({
        where: {
          cycleId: id,
          tenantId: cycle.tenantId,
          employee: { department: currentUser.profile.department },
        },
      });
      return { ...cycle, evaluationCount: deptCount };
    }

    return { ...cycle, evaluationCount: cycle._count.evaluations };
  }

  async deleteCycle(id: number, ctx: AuditContext, currentUser: { tenantId?: string }) {
    const cycle = await this.prisma.evaluationCycle.findUnique({ where: { id } });
    if (!cycle || cycle.deletedAt) {
      throw new NotFoundException('Cycle not found');
    }

    if (currentUser.tenantId && cycle.tenantId && currentUser.tenantId !== cycle.tenantId) {
      throw new ForbiddenException('Cross-tenant delete denied');
    }

    const evalCount = await this.prisma.performanceEvaluation.count({ where: { cycleId: id } });
    if (evalCount > 0) {
      throw new ConflictException('Cannot delete a cycle with evaluations');
    }

    const updated = await this.prisma.evaluationCycle.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.audit.log(ctx, 'DELETE_CYCLE', 'EvaluationCycle', id, cycle, updated);

    return { message: `Cycle ${id} deleted` };
  }

  private async notifyCycleStart(period: EvaluationPeriod, tenantId?: string | null) {
    const where: any = { isActive: true, deletedAt: null };
    if (tenantId) where.tenantId = tenantId;

    const users = await this.prisma.user.findMany({
      where,
      select: { id: true },
    });

    if (users.length === 0) return;

    const message = `A ${period} performance evaluation cycle has started.`;

    await this.prisma.notification.createMany({
      data: users.map((u) => ({ recipientId: u.id, message })),
    });

    for (const u of users.slice(0, 5)) {
      await this.notifications.createInternal(u.id, message);
    }
  }
}
