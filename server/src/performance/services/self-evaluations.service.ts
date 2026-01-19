import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSelfEvaluationDto } from '../dto/create-self-evaluation.dto';
import { AuditContext, PerformanceAuditService } from './performance-audit.service';
import { NotificationService } from '../../notification/notification.service';
import { Role } from '@prisma/client';

@Injectable()
export class SelfEvaluationsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
    private audit: PerformanceAuditService,
  ) {}

  private sanitize(text: string) {
    return text.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  }

  async createSelfEvaluation(
    evaluationId: number,
    dto: CreateSelfEvaluationDto,
    ctx: AuditContext,
    currentUser: { id: number; role: Role; tenantId?: string },
  ) {
    const evaluation = await this.prisma.performanceEvaluation.findUnique({
      where: { id: evaluationId },
      include: {
        employee: { include: { user: true, manager: { include: { user: true } } } },
        selfReview: true,
      },
    });

    if (!evaluation) throw new NotFoundException('Evaluation not found');

    if (currentUser.tenantId && evaluation.tenantId && currentUser.tenantId !== evaluation.tenantId) {
      throw new ForbiddenException('Cross-tenant create denied');
    }

    if (evaluation.selfReview) throw new ConflictException('Self review already exists');

    if (evaluation.status !== 'DRAFT' && evaluation.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Evaluation is not editable');
    }

    if (currentUser.role === Role.EMPLOYEE) {
      if (evaluation.employee.userId !== currentUser.id) {
        throw new ForbiddenException('You can only submit self-review for your own evaluation');
      }
    } else if (currentUser.role !== Role.HR_ADMIN && currentUser.role !== Role.SYSTEM_ADMIN) {
      throw new ForbiddenException('Insufficient permission');
    }

    const created = await this.prisma.selfEvaluation.create({
      data: {
        evaluationId,
        comments: this.sanitize(dto.comments),
        achievements: dto.achievements ? this.sanitize(dto.achievements) : undefined,
        challenges: dto.challenges ? this.sanitize(dto.challenges) : undefined,
        selfScore: dto.selfScore,
      },
    });

    await this.audit.log(ctx, 'CREATE_SELF_REVIEW', 'SelfEvaluation', created.id, undefined, created);

    if (evaluation.status === 'DRAFT') {
      await this.prisma.performanceEvaluation.update({
        where: { id: evaluationId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    if (evaluation.employee.manager?.userId) {
      await this.notifications.createInternal(
        evaluation.employee.manager.userId,
        'A self-performance review has been submitted by your direct report.',
      );
    }

    return created;
  }

  async getSelfEvaluation(evaluationId: number, currentUser: { tenantId?: string }) {
    const self = await this.prisma.selfEvaluation.findUnique({ where: { evaluationId } });
    if (!self) throw new NotFoundException('Self review not found');

    const evaluation = await this.prisma.performanceEvaluation.findUnique({ where: { id: evaluationId } });
    if (currentUser.tenantId && evaluation?.tenantId && currentUser.tenantId !== evaluation.tenantId) {
      throw new ForbiddenException('Cross-tenant read denied');
    }

    return self;
  }

  async updateSelfEvaluation(
    id: number,
    dto: CreateSelfEvaluationDto,
    ctx: AuditContext,
    currentUser: { id: number; role: Role; tenantId?: string },
  ) {
    const existing = await this.prisma.selfEvaluation.findUnique({ where: { id }, include: { evaluation: { include: { employee: { include: { user: true } } } } } });
    if (!existing) throw new NotFoundException('Self review not found');

    if (currentUser.tenantId && existing.evaluation.tenantId && currentUser.tenantId !== existing.evaluation.tenantId) {
      throw new ForbiddenException('Cross-tenant update denied');
    }

    if (currentUser.role === Role.EMPLOYEE) {
      if (existing.evaluation.employee.userId !== currentUser.id) {
        throw new ForbiddenException('You can only update your own self-review');
      }
    } else if (currentUser.role !== Role.HR_ADMIN && currentUser.role !== Role.SYSTEM_ADMIN) {
      throw new ForbiddenException('Insufficient permission');
    }

    const updated = await this.prisma.selfEvaluation.update({
      where: { id },
      data: {
        comments: this.sanitize(dto.comments),
        achievements: dto.achievements ? this.sanitize(dto.achievements) : undefined,
        challenges: dto.challenges ? this.sanitize(dto.challenges) : undefined,
        selfScore: dto.selfScore,
      },
    });

    await this.audit.log(ctx, 'UPDATE_SELF_REVIEW', 'SelfEvaluation', id, existing, updated);

    return updated;
  }

  async deleteSelfEvaluation(id: number, ctx: AuditContext, currentUser: { id: number; role: Role; tenantId?: string }) {
    const existing = await this.prisma.selfEvaluation.findUnique({ where: { id }, include: { evaluation: { include: { employee: { include: { user: true } } } } } });
    if (!existing) throw new NotFoundException('Self review not found');

    if (currentUser.tenantId && existing.evaluation.tenantId && currentUser.tenantId !== existing.evaluation.tenantId) {
      throw new ForbiddenException('Cross-tenant delete denied');
    }

    if (currentUser.role === Role.EMPLOYEE) {
      if (existing.evaluation.employee.userId !== currentUser.id) {
        throw new ForbiddenException('You can only delete your own self-review');
      }
      if (existing.evaluation.status !== 'DRAFT') {
        throw new BadRequestException('Can only delete self-review while evaluation is DRAFT');
      }
    } else if (currentUser.role !== Role.HR_ADMIN && currentUser.role !== Role.SYSTEM_ADMIN) {
      throw new ForbiddenException('Insufficient permission');
    }

    await this.prisma.selfEvaluation.delete({ where: { id } });
    await this.audit.log(ctx, 'DELETE_SELF_REVIEW', 'SelfEvaluation', id, existing, undefined);

    return { message: `Self review ${id} deleted` };
  }
}
