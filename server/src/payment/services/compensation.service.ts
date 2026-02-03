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
}
