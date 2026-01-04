import { Injectable, NotFoundException, ForbiddenException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApplicationStatus, Role } from '@prisma/client';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { FeedbackDto } from './dto/feedback.dto';
import { MovePositionDto } from './dto/move-position.dto';
import { CurrentUserInterface } from '../../common/interfaces/current-user.interface';
import { DocumentsService } from '../../documents/documents.service';
import { CandidateService } from '../candidate/candidate.service';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger(ApplicationService.name);

  constructor(
    private prisma: PrismaService,
    private documentsService: DocumentsService,
    private notificationsService: NotificationService,
    private candidateService: CandidateService,
  ) {}

  async create(
    dto: CreateApplicationDto,
    resume: Express.Multer.File,
    currentUser?: CurrentUserInterface,
  ) {
    // Check if posting exists and is open
    const posting = await this.prisma.jobPosting.findFirst({
      where: {
        id: dto.postingId,
        status: 'OPEN',
        deletedAt: null,
      },
      include: {
        recruiter: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!posting) {
      throw new NotFoundException('Job posting not found or not accepting applications');
    }

    let candidateId: number | undefined;
    let profileId: number | undefined;
    let applicantEmail: string;

    // Internal application (authenticated employee)
    if (currentUser && currentUser.role === Role.EMPLOYEE) {
      profileId = currentUser.profile?.id;
      applicantEmail = currentUser.email;
      
      if (!profileId) {
        throw new BadRequestException('User profile not found');
      }
    } 
    // External application
    else {
      if (!dto.email || !dto.fullName) {
        throw new BadRequestException('Email and full name are required for external applications');
      }

      applicantEmail = dto.email;

      // Find or create candidate
      let candidate = await this.candidateService.findByEmail(dto.email);
      
      if (!candidate) {
        candidate = await this.prisma.candidate.create({
          data: {
            email: dto.email,
            fullName: dto.fullName,
            phone: dto.phone,
            linkedinUrl: dto.linkedinUrl,
            status: 'ACTIVE',
          },
        });
      }

      candidateId = candidate.id;
    }

    // Create application using transaction
    const application = await this.prisma.$transaction(async (tx) => {
      // Get max board position for this posting
      const lastApp = await tx.application.findFirst({
        where: { postingId: dto.postingId },
        orderBy: { boardPosition: 'desc' },
      });

      const boardPosition = lastApp?.boardPosition ? lastApp.boardPosition + 1 : 1;

      const app = await tx.application.create({
        data: {
          postingId: dto.postingId,
          candidateId,
          profileId,
          status: ApplicationStatus.PENDING,
          boardPosition,
        },
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

      // Upload resume if provided
      if (resume) {
        await this.documentsService.upload(
          resume,
          'application',
          app.id,
          'RESUME',
        );
      }

      return app;
    });

    // Notify recruiter
    if (posting.recruiter?.user?.id) {
      await this.notificationsService.createInternal(
        posting.recruiter.user.id,
        `New application received for ${posting.title}`,
      );
    }

    this.logger.log(`Application created: ${application.id} for posting ${dto.postingId}`);
    return application;
  }

  async findAllByPosting(
    postingId: number,
    filters: any,
    currentUser: CurrentUserInterface,
  ) {
    this.checkAccess(currentUser);

    const { status, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      postingId,
    };

    if (status) {
      where.status = status;
    }

    const [applications, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          boardPosition: 'asc',
        },
        include: {
          candidate: true,
          profile: {
            include: {
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
          document: true,
          interactions: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 5,
          },
        },
      }),
      this.prisma.application.count({ where }),
    ]);

    return {
      data: applications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, currentUser: CurrentUserInterface) {
    this.checkAccess(currentUser);

    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        candidate: true,
        profile: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        posting: true,
        document: true,
        interactions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    return application;
  }

  async updateStatus(
    id: number,
    dto: UpdateStatusDto,
    currentUser: CurrentUserInterface,
  ) {
    this.checkAccess(currentUser);

    const application = await this.findOne(id, currentUser);

    const updateData: any = {
      status: dto.status,
    };

    // Update timestamps based on status
    if (dto.status === ApplicationStatus.INTERVIEW && !application.interviewedAt) {
      updateData.interviewedAt = new Date();
    } else if (dto.status === ApplicationStatus.HIRED && !application.hiredAt) {
      updateData.hiredAt = new Date();
    }

    const updated = await this.prisma.application.update({
      where: { id },
      data: updateData,
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

    // Send email notification to candidate
    const recipientEmail = application.candidate?.email || application.profile?.user?.email;
    if (recipientEmail) {
      const subject = `Application Status Update - ${application.posting.title}`;
      const body = `
        <h2>Application Status Update</h2>
        <p>Your application for <strong>${application.posting.title}</strong> has been updated.</p>
        <p><strong>New Status:</strong> ${dto.status}</p>
        <p>Thank you for your interest in our company.</p>
      `;
      await this.notificationsService.sendEmail(recipientEmail, subject, body);
    }

    this.logger.log(`Application ${id} status updated to ${dto.status}`);
    return updated;
  }

  async movePosition(
    id: number,
    dto: MovePositionDto,
    currentUser: CurrentUserInterface,
  ) {
    this.checkAccess(currentUser);

    await this.findOne(id, currentUser);

    return this.prisma.application.update({
      where: { id },
      data: {
        boardPosition: dto.boardPosition,
      },
    });
  }

  async addFeedback(
    id: number,
    dto: FeedbackDto,
    currentUser: CurrentUserInterface,
  ) {
    this.checkAccess(currentUser);

    await this.findOne(id, currentUser);

    return this.prisma.application.update({
      where: { id },
      data: {
        feedback: dto.feedback,
        score: dto.score,
      },
    });
  }

  private checkAccess(currentUser: CurrentUserInterface) {
    if (currentUser.role !== Role.RECRUITER && currentUser.role !== Role.HR_ADMIN) {
      throw new ForbiddenException('Only recruiters and HR admins can manage applications');
    }
  }
}
