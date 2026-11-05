import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DepartureStatus,
  DepartureType,
  Prisma,
  Role,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../../notification/notification.service';
import { CreateDepartureDto } from '../dto/create-departure.dto';
import { QueryDeparturesDto } from '../dto/query-departures.dto';
import { UpdateDepartureDto } from '../dto/update-departure.dto';
import { ChangeStatusDto } from '../dto/change-status.dto';
import { UpdateSeveranceDto } from '../dto/update-severance.dto';

@Injectable()
export class DeparturesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
  ) {}

  private computeNoticeDays(noticeDate: Date, lastWorkDate: Date): number {
    const diffMs = lastWorkDate.getTime() - noticeDate.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (days < 0) throw new BadRequestException('lastWorkDate must be after noticeDate');
    return days;
  }

  private validateStatusTransition(from: DepartureStatus, to: DepartureStatus) {
    const allowed: Record<DepartureStatus, DepartureStatus[]> = {
      PENDING: [DepartureStatus.APPROVED, DepartureStatus.CANCELLED],
      APPROVED: [DepartureStatus.IN_PROGRESS, DepartureStatus.CANCELLED],
      IN_PROGRESS: [DepartureStatus.COMPLETED, DepartureStatus.CANCELLED],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!allowed[from]?.includes(to)) {
      throw new BadRequestException(`Invalid status transition from ${from} to ${to}`);
    }
  }

  private async logHistory(
    tx: Prisma.TransactionClient,
    departureId: number,
    eventType: string,
    details: any,
    performedById?: number,
  ) {
    await tx.departureHistory.create({
      data: {
        departureId,
        eventType,
        details,
        performedById,
      },
    });
  }

  async create(dto: CreateDepartureDto, currentUser: { id: number; role: Role; tenantId?: string }) {
    const employee = await this.prisma.profile.findFirst({
      where: { id: dto.profileId, deletedAt: null },
      select: { id: true, userId: true, managerId: true, user: { select: { tenantId: true } } },
    });

    if (!employee) throw new NotFoundException('Employee profile not found');

    if (currentUser.role === Role.EMPLOYEE) {
      if (dto.type !== DepartureType.RESIGNATION) {
        throw new ForbiddenException('Employees can only initiate resignations');
      }
      if (employee.userId !== currentUser.id) {
        throw new ForbiddenException('You can only initiate a departure for your own profile');
      }
    }

    if (currentUser.role === Role.MANAGER) {
      const managerProfile = await this.prisma.profile.findUnique({
        where: { userId: currentUser.id },
        select: { id: true },
      });
      if (!managerProfile) throw new ForbiddenException('Manager profile not found');
      if (employee.managerId !== managerProfile.id) {
        throw new ForbiddenException('Managers can only initiate departures for direct reports');
      }
    }

    const tenantId = currentUser.tenantId ?? employee.user.tenantId ?? undefined;

    const noticeDate = new Date(dto.noticeDate);
    const lastWorkDate = new Date(dto.lastWorkDate);
    const actualNoticeDays = this.computeNoticeDays(noticeDate, lastWorkDate);

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const departure = await tx.departure.create({
          data: {
            employee: { connect: { id: employee.id } },
            type: dto.type,
            reason: dto.reason,
            noticeDate,
            lastWorkDate,
            requiredNoticeDays: dto.requiredNoticeDays,
            actualNoticeDays,
            status: DepartureStatus.PENDING,
            tenantId,
            createdBy: { connect: { id: currentUser.id } },
            updatedBy: { connect: { id: currentUser.id } },
          },
        });

        await this.logHistory(
          tx,
          departure.id,
          'CREATE',
          {
            employeeId: employee.id,
            type: dto.type,
            noticeDate: dto.noticeDate,
            lastWorkDate: dto.lastWorkDate,
          },
          currentUser.id,
        );

        return departure;
      });

      if (employee.managerId) {
        const manager = await this.prisma.profile.findUnique({
          where: { id: employee.managerId },
          select: { userId: true },
        });
        if (manager?.userId) {
          await this.notifications.create({
            recipientId: manager.userId,
            message: `A departure has been initiated for profile ${employee.id}.`,
            linkUrl: `/app/departures/${created.id}`,
          });
        }
      }

      await this.notifications.create({
        recipientId: employee.userId,
        message: `Your departure request has been created and is pending review.`,
        linkUrl: `/app/departures/${created.id}`,
      });

      return created;
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('A departure already exists for this employee and notice date');
      }
      throw e;
    }
  }

  async findAll(query: QueryDeparturesDto, currentUser: { id: number; role: Role; tenantId?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.DepartureWhereInput = {};

    if (currentUser.tenantId) where.tenantId = currentUser.tenantId;

    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.profileId) where.employeeId = query.profileId;

    if (currentUser.role === Role.EMPLOYEE) {
      const profile = await this.prisma.profile.findUnique({ where: { userId: currentUser.id }, select: { id: true } });
      if (!profile) throw new ForbiddenException('User profile not found');
      where.employeeId = profile.id;
    }

    if (currentUser.role === Role.MANAGER) {
      const managerProfile = await this.prisma.profile.findUnique({ where: { userId: currentUser.id }, select: { id: true } });
      if (!managerProfile) throw new ForbiddenException('Manager profile not found');
      where.employee = { managerId: managerProfile.id };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.departure.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: { select: { id: true, fullName: true, department: true, managerId: true, userId: true } },
        },
      }),
      this.prisma.departure.count({ where }),
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

  async findOne(id: number, currentUser: { tenantId?: string }) {
    const departure = await this.prisma.departure.findUnique({
      where: { id },
      include: {
        employee: true,
        exitInterview: true,
        exitSurvey: true,
        documents: true,
        checklistItems: true,
        handoverPlan: true,
        history: { orderBy: { timestamp: 'desc' }, include: { performedBy: { select: { id: true, email: true } } } },
      },
    });

    if (!departure) throw new NotFoundException('Departure not found');

    if (currentUser.tenantId && departure.tenantId && currentUser.tenantId !== departure.tenantId) {
      throw new ForbiddenException('Cross-tenant read denied');
    }

    const checklistTotal = departure.checklistItems.length;
    const checklistCompleted = departure.checklistItems.filter((i) => i.status === 'COMPLETED').length;

    return {
      ...departure,
      checklistCompletion: checklistTotal ? checklistCompleted / checklistTotal : 0,
    };
  }

  async update(id: number, dto: UpdateDepartureDto, currentUser: { id: number; tenantId?: string }) {
    const existing = await this.prisma.departure.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Departure not found');

    if (currentUser.tenantId && existing.tenantId && currentUser.tenantId !== existing.tenantId) {
      throw new ForbiddenException('Cross-tenant update denied');
    }

    const data: Prisma.DepartureUpdateInput = {
      updatedBy: { connect: { id: currentUser.id } },
    };

    if (dto.type) data.type = dto.type;
    if (dto.reason !== undefined) data.reason = dto.reason;
    if (dto.requiredNoticeDays !== undefined) data.requiredNoticeDays = dto.requiredNoticeDays;
    if (dto.notes !== undefined) data.notes = dto.notes;

    if (dto.noticeDate) data.noticeDate = new Date(dto.noticeDate);
    if (dto.lastWorkDate) data.lastWorkDate = new Date(dto.lastWorkDate);

    if (dto.severancePay !== undefined) data.severancePay = dto.severancePay;
    if (dto.severanceBreakdown !== undefined) data.severanceBreakdown = dto.severanceBreakdown as any;
    if (dto.severanceApproved !== undefined) data.severanceApproved = dto.severanceApproved;

    const nextNoticeDate = dto.noticeDate ? new Date(dto.noticeDate) : existing.noticeDate;
    const nextLastWorkDate = dto.lastWorkDate ? new Date(dto.lastWorkDate) : existing.lastWorkDate;

    data.actualNoticeDays = this.computeNoticeDays(nextNoticeDate, nextLastWorkDate);

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.departure.update({ where: { id }, data });
      await this.logHistory(tx, id, 'UPDATE', dto, currentUser.id);
      return result;
    });

    return updated;
  }

  async changeStatus(id: number, dto: ChangeStatusDto, currentUser: { id: number; tenantId?: string }) {
    const existing = await this.prisma.departure.findUnique({ where: { id }, include: { employee: { select: { id: true, userId: true } } } });
    if (!existing) throw new NotFoundException('Departure not found');

    if (currentUser.tenantId && existing.tenantId && currentUser.tenantId !== existing.tenantId) {
      throw new ForbiddenException('Cross-tenant update denied');
    }

    this.validateStatusTransition(existing.status, dto.status);

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.departure.update({
        where: { id },
        data: {
          status: dto.status,
          notes: dto.notes ?? existing.notes,
          updatedBy: { connect: { id: currentUser.id } },
        },
      });

      await this.logHistory(
        tx,
        id,
        'STATUS_CHANGE',
        { from: existing.status, to: dto.status, notes: dto.notes },
        currentUser.id,
      );

      if (dto.status === DepartureStatus.COMPLETED) {
        await tx.profile.update({
          where: { id: existing.employeeId },
          data: {
            isTerminated: true,
            terminationDate: existing.lastWorkDate,
          },
        });
        await this.logHistory(
          tx,
          id,
          'PROFILE_TERMINATED',
          { profileId: existing.employeeId, terminationDate: existing.lastWorkDate },
          currentUser.id,
        );
      }

      return result;
    });

    await this.notifications.create({
      recipientId: existing.employee.userId,
      message: `Departure status changed to ${dto.status}.`,
      linkUrl: `/app/departures/${id}`,
    });

    return updated;
  }

  async updateSeverance(id: number, dto: UpdateSeveranceDto, currentUser: { id: number; tenantId?: string }) {
    const existing = await this.prisma.departure.findUnique({ where: { id }, include: { employee: { select: { userId: true } } } });
    if (!existing) throw new NotFoundException('Departure not found');

    if (currentUser.tenantId && existing.tenantId && currentUser.tenantId !== existing.tenantId) {
      throw new ForbiddenException('Cross-tenant update denied');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.departure.update({
        where: { id },
        data: {
          severancePay: dto.severancePay,
          severanceBreakdown: dto.severanceBreakdown as any,
          severanceApproved: dto.severanceApproved ?? existing.severanceApproved,
          updatedBy: { connect: { id: currentUser.id } },
        },
      });

      await this.logHistory(
        tx,
        id,
        dto.severanceApproved ? 'SEVERANCE_APPROVED' : 'SEVERANCE_UPDATED',
        dto,
        currentUser.id,
      );

      return result;
    });

    await this.notifications.create({
      recipientId: existing.employee.userId,
      message: `Severance details have been updated.`,
      linkUrl: `/app/departures/${id}`,
    });

    return updated;
  }

  async remove(id: number, currentUser: { id: number; tenantId?: string }) {
    const existing = await this.prisma.departure.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Departure not found');

    if (currentUser.tenantId && existing.tenantId && currentUser.tenantId !== existing.tenantId) {
      throw new ForbiddenException('Cross-tenant delete denied');
    }

    if (existing.status !== DepartureStatus.PENDING && existing.status !== DepartureStatus.CANCELLED) {
      throw new BadRequestException('Only PENDING or CANCELLED departures can be removed');
    }

    if (existing.status === DepartureStatus.PENDING) {
      const updated = await this.prisma.$transaction(async (tx) => {
        const result = await tx.departure.update({
          where: { id },
          data: { status: DepartureStatus.CANCELLED, updatedBy: { connect: { id: currentUser.id } } },
        });
        await this.logHistory(tx, id, 'CANCEL', { from: DepartureStatus.PENDING, to: DepartureStatus.CANCELLED }, currentUser.id);
        return result;
      });
      return { message: 'Departure cancelled', departure: updated };
    }

    await this.prisma.departure.delete({ where: { id } });
    return { message: 'Departure deleted' };
  }
}
