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
}
