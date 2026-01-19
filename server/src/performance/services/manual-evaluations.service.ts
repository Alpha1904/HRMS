import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateManualEvaluationDto } from '../dto/create-manual-evaluation.dto';
import { AuditContext, PerformanceAuditService } from './performance-audit.service';
import { NotificationService } from '../../notification/notification.service';
import { Role } from '@prisma/client';

@Injectable()
export class ManualEvaluationsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
    private audit: PerformanceAuditService,
  ) {}

  private sanitize(text: string) {
    return text.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  }

  private async getCurrentProfileId(userId: number) {
    const profile = await this.prisma.profile.findUnique({ where: { userId }, select: { id: true } });
    if (!profile) throw new ForbiddenException('User profile not found');
    return profile.id;
  }

  async createManualEvaluation(
    evaluationId: number,
    dto: CreateManualEvaluationDto,
    ctx: AuditContext,
    currentUser: { id: number; role: Role; tenantId?: string },
  ) {
    const evaluation = await this.prisma.performanceEvaluation.findUnique({
      where: { id: evaluationId },
      include: { employee: { include: { user: true } }, manualReview: true },
    });

    if (!evaluation) throw new NotFoundException('Evaluation not found');

    if (currentUser.tenantId && evaluation.tenantId && currentUser.tenantId !== evaluation.tenantId) {
      throw new ForbiddenException('Cross-tenant create denied');
    }

    if (evaluation.manualReview) {
      throw new ConflictException('Manual review already exists');
    }

    if (evaluation.status !== 'DRAFT' && evaluation.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Evaluation is not editable');
    }

    const reviewerProfileId = await this.getCurrentProfileId(currentUser.id);

    if (currentUser.role === Role.MANAGER) {
      if (evaluation.employee.managerId !== reviewerProfileId) {
        throw new ForbiddenException('Only the direct manager can submit this review');
      }
    } else if (currentUser.role !== Role.HR_ADMIN && currentUser.role !== Role.SYSTEM_ADMIN) {
      throw new ForbiddenException('Insufficient permission');
    }

    const created = await this.prisma.manualEvaluation.create({
      data: {
        evaluationId,
        reviewerId: reviewerProfileId,
        strengths: this.sanitize(dto.strengths),
        weaknesses: this.sanitize(dto.weaknesses),
        achievements: dto.achievements ? this.sanitize(dto.achievements) : undefined,
        recommendations: dto.recommendations ? this.sanitize(dto.recommendations) : undefined,
        score: dto.score,
      },
    });

    await this.audit.log(ctx, 'CREATE_MANUAL_REVIEW', 'ManualEvaluation', created.id, undefined, created);

    if (evaluation.status === 'DRAFT') {
      await this.prisma.performanceEvaluation.update({
        where: { id: evaluationId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    await this.notifications.createInternal(
      evaluation.employee.userId,
      'Your manager has submitted a manual performance review.',
    );

    return created;
  }

  async getManualEvaluation(evaluationId: number, currentUser: { tenantId?: string }) {
    const manual = await this.prisma.manualEvaluation.findUnique({ where: { evaluationId } });
    if (!manual) throw new NotFoundException('Manual review not found');

    const evaluation = await this.prisma.performanceEvaluation.findUnique({ where: { id: evaluationId } });
    if (currentUser.tenantId && evaluation?.tenantId && currentUser.tenantId !== evaluation.tenantId) {
      throw new ForbiddenException('Cross-tenant read denied');
    }

    return manual;
  }

  async updateManualEvaluation(
    id: number,
    dto: CreateManualEvaluationDto,
    ctx: AuditContext,
    currentUser: { id: number; role: Role; tenantId?: string },
  ) {
    const existing = await this.prisma.manualEvaluation.findUnique({ where: { id }, include: { evaluation: { include: { employee: true } } } });
    if (!existing) throw new NotFoundException('Manual review not found');

    if (currentUser.tenantId && existing.evaluation.tenantId && currentUser.tenantId !== existing.evaluation.tenantId) {
      throw new ForbiddenException('Cross-tenant update denied');
    }

    const reviewerProfileId = await this.getCurrentProfileId(currentUser.id);

    if (currentUser.role === Role.MANAGER) {
      if (existing.reviewerId !== reviewerProfileId) {
        throw new ForbiddenException('Managers can only update their own reviews');
      }
    } else if (currentUser.role !== Role.HR_ADMIN && currentUser.role !== Role.SYSTEM_ADMIN) {
      throw new ForbiddenException('Insufficient permission');
    }

    const updated = await this.prisma.manualEvaluation.update({
      where: { id },
      data: {
        strengths: this.sanitize(dto.strengths),
        weaknesses: this.sanitize(dto.weaknesses),
        achievements: dto.achievements ? this.sanitize(dto.achievements) : undefined,
        recommendations: dto.recommendations ? this.sanitize(dto.recommendations) : undefined,
        score: dto.score,
      },
    });

    await this.audit.log(ctx, 'UPDATE_MANUAL_REVIEW', 'ManualEvaluation', id, existing, updated);

    return updated;
  }

  async deleteManualEvaluation(id: number, ctx: AuditContext, currentUser: { tenantId?: string }) {
    const existing = await this.prisma.manualEvaluation.findUnique({ where: { id }, include: { evaluation: true } });
    if (!existing) throw new NotFoundException('Manual review not found');

    if (currentUser.tenantId && existing.evaluation.tenantId && currentUser.tenantId !== existing.evaluation.tenantId) {
      throw new ForbiddenException('Cross-tenant delete denied');
    }

    await this.prisma.manualEvaluation.delete({ where: { id } });
    await this.audit.log(ctx, 'DELETE_MANUAL_REVIEW', 'ManualEvaluation', id, existing, undefined);

    return { message: `Manual review ${id} deleted` };
  }
}
