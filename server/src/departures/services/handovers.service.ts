import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../../notification/notification.service';
import { Role } from '@prisma/client';
import { CreateHandoverDto } from '../dto/create-handover.dto';

@Injectable()
export class HandoversService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
  ) {}

  async upsertPlan(departureId: number, dto: CreateHandoverDto, currentUser: { id: number }) {
    const departure = await this.prisma.departure.findUnique({
      where: { id: departureId },
      include: { employee: { select: { userId: true } } },
    });
    if (!departure) throw new NotFoundException('Departure not found');

    const plan = await this.prisma.handoverPlan.upsert({
      where: { departureId },
      create: {
        departure: { connect: { id: departureId } },
        assignee: { connect: { id: dto.assigneeId } },
        notes: dto.notes,
        tasks: dto.tasks as any,
      },
      update: {
        assignee: { connect: { id: dto.assigneeId } },
        notes: dto.notes,
        tasks: dto.tasks as any,
      },
    });

    await this.prisma.departureHistory.create({
      data: {
        departureId,
        eventType: 'HANDOVER_UPDATED',
        details: { assigneeId: dto.assigneeId },
        performedById: currentUser.id,
      },
    });

    const assignee = await this.prisma.profile.findUnique({
      where: { id: dto.assigneeId },
      select: { userId: true },
    });
    if (assignee?.userId) {
      await this.notifications.create({
        recipientId: assignee.userId,
        message: `You have been assigned as handover assignee for departure ${departureId}.`,
        linkUrl: `/app/departures/${departureId}`,
      });
    }

    return plan;
  }

  async markCompleted(departureId: number, currentUser: { id: number; role: Role }) {
    const plan = await this.prisma.handoverPlan.findUnique({
      where: { departureId },
      include: { assignee: { select: { userId: true } } },
    });
    if (!plan) throw new NotFoundException('Handover plan not found');

    const isHr = currentUser.role === Role.HR_ADMIN || currentUser.role === Role.SYSTEM_ADMIN;
    const isAssignee = plan.assignee.userId === currentUser.id;

    if (!isHr && !isAssignee) {
      throw new ForbiddenException('Only the handover assignee or HR can complete the handover');
    }

    const updated = await this.prisma.handoverPlan.update({
      where: { departureId },
      data: { completed: true },
    });

    await this.prisma.departureHistory.create({
      data: {
        departureId,
        eventType: 'HANDOVER_COMPLETED',
        details: {},
        performedById: currentUser.id,
      },
    });

    return updated;
  }
}
