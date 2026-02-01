import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../../notification/notification.service';
import { Role } from '@prisma/client';
import { SubmitSurveyDto } from '../dto/submit-survey.dto';

@Injectable()
export class ExitSurveysService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
  ) {}

  async submit(departureId: number, dto: SubmitSurveyDto, currentUser: { id: number; role: Role }) {
    const departure = await this.prisma.departure.findUnique({
      where: { id: departureId },
      include: { employee: { select: { userId: true, managerId: true } }, exitSurvey: true },
    });
    if (!departure) throw new NotFoundException('Departure not found');

    if (currentUser.role !== Role.EMPLOYEE) {
      throw new ForbiddenException('Only employees can submit exit surveys');
    }

    if (departure.employee.userId !== currentUser.id) {
      throw new ForbiddenException('You can only submit a survey for your own departure');
    }

    const survey = await this.prisma.exitSurvey.upsert({
      where: { departureId },
      create: {
        departure: { connect: { id: departureId } },
        responses: dto.responses as any,
      },
      update: {
        responses: dto.responses as any,
        submittedAt: new Date(),
      },
    });

    await this.prisma.departureHistory.create({
      data: {
        departureId,
        eventType: 'SURVEY_SUBMITTED',
        details: {},
        performedById: currentUser.id,
      },
    });

    if (departure.employee.managerId) {
      const manager = await this.prisma.profile.findUnique({
        where: { id: departure.employee.managerId },
        select: { userId: true },
      });
      if (manager?.userId) {
        await this.notifications.create({
          recipientId: manager.userId,
          message: `An exit survey has been submitted for departure ${departureId}.`,
          linkUrl: `/app/departures/${departureId}`,
        });
      }
    }

    return survey;
  }
}
