import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { CurrentUserInterface } from '../../common/interfaces/current-user.interface'
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class InteractionService {
  private readonly logger = new Logger(InteractionService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationService,
  ) {}

  async create(
    dto: CreateInteractionDto,
    applicationId: number,
    currentUser: CurrentUserInterface,
  ) {
    this.checkAccess(currentUser);

    // Verify application exists
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: true,
        profile: {
          include: {
            user: true,
          },
        },
        posting: true,
      },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${applicationId} not found`);
    }

    // Create interaction
    const interaction = await this.prisma.interaction.create({
      data: {
        type: dto.type,
        content: dto.content,
        applicationId,
      },
    });

    // Send email for certain interaction types
    const recipientEmail = application.candidate?.email || application.profile?.user?.email;
    
    if (recipientEmail && ['EMAIL', 'INTERVIEW_INVITE', 'DOC_REQUEST'].includes(dto.type)) {
      let subject: string = '';
      let body: string = '';

      switch (dto.type) {
        case 'EMAIL':
          subject = `Message regarding your application - ${application.posting.title}`;
          body = `
            <h2>Message from ${application.posting.department || 'Hiring Team'}</h2>
            <p>${dto.content}</p>
            <hr>
            <p><small>This is regarding your application for ${application.posting.title}</small></p>
          `;
          break;

        case 'INTERVIEW_INVITE':
          subject = `Interview Invitation - ${application.posting.title}`;
          body = `
            <h2>You're Invited to an Interview!</h2>
            <p>Congratulations! We'd like to invite you for an interview for the position of <strong>${application.posting.title}</strong>.</p>
            <h3>Details:</h3>
            <p>${dto.content}</p>
            <p>Please confirm your availability by replying to this email.</p>
            <p>We look forward to meeting you!</p>
          `;
          break;

        case 'DOC_REQUEST':
          subject = `Additional Documents Requested - ${application.posting.title}`;
          body = `
            <h2>Document Request</h2>
            <p>We need additional documents from you for your application to <strong>${application.posting.title}</strong>.</p>
            <h3>Required Documents:</h3>
            <p>${dto.content}</p>
            <p>Please provide these documents at your earliest convenience.</p>
          `;
          break;
      }

      await this.notificationsService.sendEmail(recipientEmail, subject, body);
      this.logger.log(`Email sent to ${recipientEmail} for interaction type: ${dto.type}`);
    }

    this.logger.log(`Interaction created: ${interaction.id} for application ${applicationId}`);
    return interaction;
  }

  async findByApplication(applicationId: number, currentUser: CurrentUserInterface) {
    this.checkAccess(currentUser);

    // Verify application exists
    await this.prisma.application.findUniqueOrThrow({
      where: { id: applicationId },
    });

    return this.prisma.interaction.findMany({
      where: {
        applicationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private checkAccess(currentUser: CurrentUserInterface) {
    if (currentUser.role !== Role.RECRUITER && currentUser.role !== Role.HR_ADMIN) {
      throw new ForbiddenException('Only recruiters and HR admins can manage interactions');
    }
  }
}
