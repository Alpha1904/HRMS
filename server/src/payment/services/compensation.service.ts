import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUserInterface } from '../../common/interfaces/current-user.interface';
import { CreateCompensationDto } from '../dto/create-compensation.dto';
import { UpdateCompensationDto } from '../dto/update-compensation.dto';
import { AuditContext, PaymentAuditService } from './payment-audit.service';

@Injectable()
export class CompensationService {
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

  async create(dto: CreateCompensationDto, ctx: AuditContext) {
    const startDate = new Date(dto.startDate);
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;

    if (Number.isNaN(startDate.getTime())) {
      throw new BadRequestException('Invalid startDate');
    }
    if (endDate && Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid endDate');
    }
    if (endDate && endDate < startDate) {
      throw new BadRequestException('endDate must be after startDate');
    }

    const profile = await this.prisma.profile.findFirst({
      where: { id: dto.profileId, deletedAt: null },
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const data: Prisma.CompensationComponentCreateInput = {
      profile: { connect: { id: dto.profileId } },
      type: dto.type,
      amount: new Prisma.Decimal(dto.amount),
      frequency: dto.frequency,
      description: dto.description,
      startDate,
      endDate,
      active: dto.active ?? true,
    };

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.compensationComponent.create({ data });

      await this.audit.log(
        ctx,
        'CREATE_COMPENSATION',
        'CompensationComponent',
        created.id,
        undefined,
        created,
      );

      return created;
    });
  }

  async findByProfile(profileId: number, user: CurrentUserInterface) {
    await this.assertCanAccessProfile(profileId, user);

    return this.prisma.compensationComponent.findMany({
      where: {
        profileId,
        deletedAt: null,
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async update(id: number, dto: UpdateCompensationDto, ctx: AuditContext) {
    const existing = await this.prisma.compensationComponent.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Compensation component not found');
    }

    const nextStartDate = dto.startDate ? new Date(dto.startDate) : existing.startDate;
    const nextEndDate =
      dto.endDate === null
        ? null
        : dto.endDate
          ? new Date(dto.endDate)
          : existing.endDate;

    if (nextStartDate && Number.isNaN(nextStartDate.getTime())) {
      throw new BadRequestException('Invalid startDate');
    }
    if (nextEndDate && Number.isNaN(nextEndDate.getTime())) {
      throw new BadRequestException('Invalid endDate');
    }
    if (nextEndDate && nextStartDate && nextEndDate < nextStartDate) {
      throw new BadRequestException('endDate must be after startDate');
    }

    const data: Prisma.CompensationComponentUpdateInput = {
      type: dto.type,
      amount: dto.amount !== undefined ? new Prisma.Decimal(dto.amount) : undefined,
      frequency: dto.frequency === null ? null : dto.frequency,
      description: dto.description === null ? null : dto.description,
      startDate: dto.startDate ? nextStartDate : undefined,
      endDate: dto.endDate !== undefined ? nextEndDate : undefined,
      active: dto.active,
    };

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.compensationComponent.update({
        where: { id },
        data,
      });

      await this.audit.log(
        ctx,
        'UPDATE_COMPENSATION',
        'CompensationComponent',
        updated.id,
        existing,
        updated,
      );

      return updated;
    });
  }

  async softDelete(id: number, ctx: AuditContext) {
    const existing = await this.prisma.compensationComponent.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Compensation component not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const deleted = await tx.compensationComponent.update({
        where: { id },
        data: { deletedAt: new Date(), active: false },
      });

      await this.audit.log(
        ctx,
        'DELETE_COMPENSATION',
        'CompensationComponent',
        deleted.id,
        existing,
        deleted,
      );

      return deleted;
    });
  }
}
