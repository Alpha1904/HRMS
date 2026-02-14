import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUserInterface } from '../../common/interfaces/current-user.interface';
import { CreateAdjustmentDto } from '../dto/create-adjustment.dto';
import { UpdateAdjustmentDto } from '../dto/update-adjustment.dto';
import { AuditContext, PaymentAuditService } from './payment-audit.service';

@Injectable()
export class AdjustmentService {
  constructor(
    private prisma: PrismaService,
    private audit: PaymentAuditService,
  ) {}

  private async assertCanAccessProfile(
    profileId: number,
    user: CurrentUserInterface,
  ) {
    if (user.role === Role.HR_ADMIN || user.role === Role.SYSTEM_ADMIN) {
      return;
    }

    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { userId: true },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    if (profile.userId !== user.id) {
      throw new ForbiddenException('You can only access your own profile');
    }
  }

  async create(dto: CreateAdjustmentDto, ctx: AuditContext) {
    const effectiveDate = new Date(dto.effectiveDate);
    if (Number.isNaN(effectiveDate.getTime())) {
      throw new BadRequestException('Invalid effectiveDate');
    }

    const profile = await this.prisma.profile.findFirst({
      where: { id: dto.profileId, deletedAt: null },
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    if (dto.componentId) {
      const component = await this.prisma.compensationComponent.findFirst({
        where: { id: dto.componentId, profileId: dto.profileId, deletedAt: null },
        select: { id: true },
      });
      if (!component) {
        throw new BadRequestException('Invalid componentId for this profile');
      }
    }

    const data: Prisma.SalaryAdjustmentCreateInput = {
      profile: { connect: { id: dto.profileId } },
      component: dto.componentId ? { connect: { id: dto.componentId } } : undefined,
      adjustmentType: dto.adjustmentType,
      amount: new Prisma.Decimal(dto.amount),
      percentage: dto.percentage,
      reason: dto.reason,
      effectiveDate,
      createdBy: { connect: { id: ctx.performedById } },
    };

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.salaryAdjustment.create({ data });

      await this.audit.log(
        ctx,
        'CREATE_SALARY_ADJUSTMENT',
        'SalaryAdjustment',
        created.id,
        undefined,
        created,
      );

      return created;
    });
  }

  async findByProfile(profileId: number, user: CurrentUserInterface) {
    await this.assertCanAccessProfile(profileId, user);

    return this.prisma.salaryAdjustment.findMany({
      where: { profileId },
      orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }],
      include: {
        component: true,
        createdBy: { select: { id: true, email: true, role: true } },
      },
    });
  }

  async update(id: number, dto: UpdateAdjustmentDto, ctx: AuditContext) {
    const existing = await this.prisma.salaryAdjustment.findUnique({
      where: { id },
      include: {
        component: true,
        createdBy: { select: { id: true, email: true, role: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException('Salary adjustment not found');
    }

    const effectiveDate = dto.effectiveDate ? new Date(dto.effectiveDate) : undefined;
    if (effectiveDate && Number.isNaN(effectiveDate.getTime())) {
      throw new BadRequestException('Invalid effectiveDate');
    }

    if (dto.componentId !== undefined && dto.componentId !== null) {
      const component = await this.prisma.compensationComponent.findFirst({
        where: {
          id: dto.componentId,
          profileId: existing.profileId,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!component) {
        throw new BadRequestException('Invalid componentId for this profile');
      }
    }

    const componentUpdate: Prisma.CompensationComponentUpdateOneWithoutAdjustmentsNestedInput | undefined =
      dto.componentId === undefined
        ? undefined
        : dto.componentId === null
          ? { disconnect: true }
          : { connect: { id: dto.componentId } };

    const data: Prisma.SalaryAdjustmentUpdateInput = {
      component: componentUpdate,
      adjustmentType: dto.adjustmentType,
      amount: dto.amount !== undefined ? new Prisma.Decimal(dto.amount) : undefined,
      percentage: dto.percentage === null ? null : dto.percentage,
      reason: dto.reason === null ? null : dto.reason,
      effectiveDate,
    };

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.salaryAdjustment.update({
        where: { id },
        data,
        include: {
          component: true,
          createdBy: { select: { id: true, email: true, role: true } },
        },
      });

      await this.audit.log(
        ctx,
        'UPDATE_SALARY_ADJUSTMENT',
        'SalaryAdjustment',
        updated.id,
        existing,
        updated,
      );

      return updated;
    });
  }
}
