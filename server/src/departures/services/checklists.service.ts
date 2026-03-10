import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../../notification/notification.service';
import { Role, TaskStatus } from '@prisma/client';
import { CreateChecklistItemDto } from '../dto/create-checklist-item.dto';
import { UpdateChecklistItemDto } from '../dto/update-checklist-item.dto';

@Injectable()
export class ChecklistsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
  ) {}

  async addItem(departureId: number, dto: CreateChecklistItemDto, currentUser: { id: number }) {
    const departure = await this.prisma.departure.findUnique({
      where: { id: departureId },
      include: { employee: { select: { userId: true } } },
    });
    if (!departure) throw new NotFoundException('Departure not found');

    const item = await this.prisma.departureChecklist.create({
      data: {
        departure: { connect: { id: departureId } },
        taskName: dto.taskName,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        assignee: dto.assigneeId ? { connect: { id: dto.assigneeId } } : undefined,
      },
    });

    await this.prisma.departureHistory.create({
      data: {
        departureId,
        eventType: 'CHECKLIST_CREATED',
        details: { checklistItemId: item.id, taskName: item.taskName },
        performedById: currentUser.id,
      },
    });

    if (dto.assigneeId) {
      await this.notifications.create({
        recipientId: dto.assigneeId,
        message: `You have been assigned a departure checklist task: ${dto.taskName}.`,
        linkUrl: `/app/departures/${departureId}`,
      });
    }

    return item;
  }

  async list(departureId: number) {
    const departure = await this.prisma.departure.findUnique({ where: { id: departureId }, select: { id: true } });
    if (!departure) throw new NotFoundException('Departure not found');

    return this.prisma.departureChecklist.findMany({
      where: { departureId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateItem(itemId: number, dto: UpdateChecklistItemDto, currentUser: { id: number; role: Role }) {
    const existing = await this.prisma.departureChecklist.findUnique({
      where: { id: itemId },
      include: { departure: { include: { employee: { select: { userId: true } } } } },
    });
    if (!existing) throw new NotFoundException('Checklist item not found');

    //const isHr = currentUser.role === Role.HR_ADMIN || currentUser.role === Role.SYSTEM_ADMIN;
    //const isAssignee = existing.assigneeId && existing.assigneeId === currentUser.id;

    // if (!isHr && !isAssignee) {
    //   throw new ForbiddenException('Only the assignee or HR can update this checklist item');
    // }

    const nextStatus = dto.status ?? existing.status;

    const updated = await this.prisma.departureChecklist.update({
      where: { id: itemId },
      data: {
        status: dto.status,
        notes: dto.notes,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        assignee: dto.assigneeId ? { connect: { id: dto.assigneeId } } : undefined,
        completedAt: nextStatus === TaskStatus.COMPLETED ? new Date() : null,
      },
    });

    await this.prisma.departureHistory.create({
      data: {
        departureId: existing.departureId,
        eventType: 'CHECKLIST_UPDATED',
        details: { checklistItemId: itemId, status: dto.status, assigneeId: dto.assigneeId },
        performedById: currentUser.id,
      },
    });

    if (dto.assigneeId && dto.assigneeId !== existing.assigneeId) {
      await this.notifications.create({
        recipientId: dto.assigneeId,
        message: `You have been assigned a departure checklist task: ${existing.taskName}.`,
        linkUrl: `/app/departures/${existing.departureId}`,
      });
    }

    return updated;
  }

  async removeItem(itemId: number, currentUser: { id: number }) {
    const existing = await this.prisma.departureChecklist.findUnique({ where: { id: itemId } });
    if (!existing) throw new NotFoundException('Checklist item not found');

    await this.prisma.departureChecklist.delete({ where: { id: itemId } });

    await this.prisma.departureHistory.create({
      data: {
        departureId: existing.departureId,
        eventType: 'CHECKLIST_DELETED',
        details: { checklistItemId: itemId },
        performedById: currentUser.id,
      },
    });

    return { message: 'Checklist item deleted' };
  }
}
