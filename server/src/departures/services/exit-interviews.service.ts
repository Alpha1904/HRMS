import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../../notification/notification.service';
import { Role } from '@prisma/client';
import { ScheduleInterviewDto } from '../dto/schedule-interview.dto';
import { ConductInterviewDto } from '../dto/conduct-interview.dto';

@Injectable()
export class ExitInterviewsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
  ) {}

  async schedule(departureId: number, dto: ScheduleInterviewDto, currentUser: { id: number; role: Role }) {
    const departure = await this.prisma.departure.findUnique({
      where: { id: departureId },
      include: { employee: { select: { userId: true, id: true } }, exitInterview: true },
    });
    if (!departure) throw new NotFoundException('Departure not found');

    const interview = await this.prisma.exitInterview.upsert({
      where: { departureId },
      create: {
        departure: { connect: { id: departureId } },
        interviewer: { connect: { id: dto.interviewerId } },
        scheduledDate: new Date(dto.scheduledDate),
        notes: '',
      },
      update: {
        interviewer: { connect: { id: dto.interviewerId } },
        scheduledDate: new Date(dto.scheduledDate),
      },
    });

    const interviewer = await this.prisma.profile.findUnique({
      where: { id: dto.interviewerId },
      select: { userId: true },
    });

    if (interviewer?.userId) {
      await this.notifications.create({
        recipientId: interviewer.userId,
        message: `You have been scheduled to conduct an exit interview for departure ${departureId}.`,
        linkUrl: `/app/departures/${departureId}`,
      });
    }

    await this.notifications.create({
      recipientId: departure.employee.userId,
      message: `Your exit interview has been scheduled.`,
      linkUrl: `/app/departures/${departureId}`,
    });

    await this.prisma.departureHistory.create({
      data: {
        departureId,
        eventType: 'INTERVIEW_SCHEDULED',
        details: { interviewerId: dto.interviewerId, scheduledDate: dto.scheduledDate },
        performedById: currentUser.id,
      },
    });

    return interview;
  }

  async conduct(departureId: number, dto: ConductInterviewDto, currentUser: { id: number; role: Role }) {
    const interview = await this.prisma.exitInterview.findUnique({
      where: { departureId },
      include: { interviewer: { select: { userId: true } }, departure: { include: { employee: { select: { userId: true } } } } },
    });
    if (!interview) throw new NotFoundException('Exit interview not found');

    if (currentUser.role !== Role.HR_ADMIN && currentUser.role !== Role.SYSTEM_ADMIN) {
      if (interview.interviewer.userId !== currentUser.id) {
        throw new ForbiddenException('Only the assigned interviewer can conduct this interview');
      }
    }

    const updated = await this.prisma.exitInterview.update({
      where: { departureId },
      data: {
        interviewDate: new Date(dto.interviewDate),
        notes: dto.notes,
      },
    });

    await this.prisma.departureHistory.create({
      data: {
        departureId,
        eventType: 'INTERVIEW_CONDUCTED',
        details: { interviewDate: dto.interviewDate },
        performedById: currentUser.id,
      },
    });

    await this.notifications.create({
      recipientId: interview.departure.employee.userId,
      message: `Your exit interview has been completed.`,
      linkUrl: `/app/departures/${departureId}`,
    });

    return updated;
  }
}
