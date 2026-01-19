import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEvaluationCriteriaDto } from '../dto/create-evaluation-criteria.dto';
import { UpdateEvaluationCriteriaDto } from '../dto/update-evaluation-criteria.dto';
import { AuditContext, PerformanceAuditService } from './performance-audit.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class EvaluationCriteriaService {
  constructor(
    private prisma: PrismaService,
    private audit: PerformanceAuditService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  private cacheKey(tenantId?: string) {
    return `performance:criteria:${tenantId ?? 'global'}`;
  }

  private async invalidateCache(tenantId?: string) {
    await this.cache.del(this.cacheKey(tenantId));
  }

  private async assertWeightsNotAboveOne(tenantId?: string) {
    const total = await this.prisma.evaluationCriteria.aggregate({
      where: { isActive: true, tenantId },
      _sum: { weight: true },
    });
    const sum = total._sum.weight ?? 0;
    if (sum > 1.00001) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: [{ field: 'weight', message: 'Active criteria weights must not exceed 1.0' }],
      });
    }
  }

  async getCriteria(filters: { isActive?: boolean; tenantId?: string }) {
    const tenantId = filters.tenantId;
    const cached = await this.cache.get<any>(this.cacheKey(tenantId));
    if (cached) return cached;

    const where: any = {};
    if (typeof filters.isActive === 'boolean') where.isActive = filters.isActive;
    if (tenantId) where.tenantId = tenantId;

    const data = await this.prisma.evaluationCriteria.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    await this.cache.set(this.cacheKey(tenantId), data, 60_000);

    return data;
  }

  async getCriteriaById(id: number) {
    const criteria = await this.prisma.evaluationCriteria.findUnique({ where: { id } });
    if (!criteria) throw new NotFoundException('Criteria not found');
    return criteria;
  }

  async createCriteria(dto: CreateEvaluationCriteriaDto, ctx: AuditContext, currentUser: { tenantId?: string }) {
    if (dto.tenantId && currentUser.tenantId && dto.tenantId !== currentUser.tenantId) {
      throw new ForbiddenException('Cross-tenant create denied');
    }

    const created = await this.prisma.evaluationCriteria.create({
      data: {
        name: dto.name,
        description: dto.description,
        weight: dto.weight,
        tenantId: currentUser.tenantId ?? dto.tenantId,
        isActive: true,
      },
    });

    await this.assertWeightsNotAboveOne(created.tenantId ?? undefined);
    await this.invalidateCache(created.tenantId ?? undefined);
    await this.audit.log(ctx, 'CREATE_CRITERIA', 'EvaluationCriteria', created.id, undefined, created);

    return created;
  }

  async updateCriteria(
    id: number,
    dto: UpdateEvaluationCriteriaDto,
    ctx: AuditContext,
    currentUser: { tenantId?: string },
  ) {
    const existing = await this.prisma.evaluationCriteria.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Criteria not found');

    if (currentUser.tenantId && existing.tenantId && currentUser.tenantId !== existing.tenantId) {
      throw new ForbiddenException('Cross-tenant update denied');
    }

    const updated = await this.prisma.evaluationCriteria.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        weight: dto.weight,
        tenantId: dto.tenantId,
      },
    });

    await this.assertWeightsNotAboveOne(updated.tenantId ?? undefined);
    await this.invalidateCache(updated.tenantId ?? undefined);
    await this.audit.log(ctx, 'UPDATE_CRITERIA', 'EvaluationCriteria', id, existing, updated);

    return updated;
  }

  async toggleCriteriaStatus(id: number, ctx: AuditContext, currentUser: { tenantId?: string }) {
    const existing = await this.prisma.evaluationCriteria.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Criteria not found');

    if (currentUser.tenantId && existing.tenantId && currentUser.tenantId !== existing.tenantId) {
      throw new ForbiddenException('Cross-tenant toggle denied');
    }

    const updated = await this.prisma.evaluationCriteria.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    await this.assertWeightsNotAboveOne(updated.tenantId ?? undefined);
    await this.invalidateCache(updated.tenantId ?? undefined);
    await this.audit.log(ctx, 'TOGGLE_CRITERIA', 'EvaluationCriteria', id, existing, updated);

    return updated;
  }

  async deleteCriteria(id: number, ctx: AuditContext, currentUser: { tenantId?: string }) {
    const existing = await this.prisma.evaluationCriteria.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Criteria not found');

    if (currentUser.tenantId && existing.tenantId && currentUser.tenantId !== existing.tenantId) {
      throw new ForbiddenException('Cross-tenant delete denied');
    }

    await this.prisma.evaluationCriteria.delete({ where: { id } });
    await this.invalidateCache(existing.tenantId ?? undefined);
    await this.audit.log(ctx, 'DELETE_CRITERIA', 'EvaluationCriteria', id, existing, undefined);

    return { message: `Criteria ${id} deleted` };
  }

  async assertWeightsSumToOneOrThrow(tenantId?: string) {
    const total = await this.prisma.evaluationCriteria.aggregate({
      where: { isActive: true, tenantId },
      _sum: { weight: true },
    });
    const sum = total._sum.weight ?? 0;

    if (Math.abs(sum - 1) > 0.0001) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: [{ field: 'weight', message: 'Active criteria weights must sum to 1.0' }],
      });
    }
  }
}
