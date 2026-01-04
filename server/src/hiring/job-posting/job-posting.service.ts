import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PostingStatus, Role } from '@prisma/client';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { UpdateJobPostingDto } from './dto/update-job-posting.dto';
import { FilterJobPostingDto } from './dto/filter-job-posting.dto';
import { CurrentUserInterface } from '../../common/interfaces/current-user.interface';

@Injectable()
export class JobPostingService {
  private readonly logger = new Logger(JobPostingService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateJobPostingDto, currentUser: CurrentUserInterface) {
    this.checkRecruiterRole(currentUser);

    const data: any = {
      ...dto,
      status: PostingStatus.DRAFT,
      recruiterId: currentUser.profile?.id,
      createdBy: currentUser.id,
    };

    if (dto.salaryRange) {
      data.salaryRange = dto.salaryRange;
    }

    const posting = await this.prisma.jobPosting.create({
      data,
      include: {
        recruiter: {
          select: {
            id: true,
            fullName: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    this.logger.log(`Job posting created: ${posting.id}`);
    return posting;
  }

  async findAll(filters: FilterJobPostingDto, currentUser: CurrentUserInterface) {
    const { status, department, site, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (currentUser.tenantId) {
      // Multi-tenancy filter would go here if needed
    }

    if (status) {
      where.status = status;
    }

    if (department) {
      where.department = department;
    }

    if (site) {
      where.site = site;
    }

    const [postings, total] = await Promise.all([
      this.prisma.jobPosting.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          publishedAt: 'desc',
        },
        include: {
          recruiter: {
            select: {
              id: true,
              fullName: true,
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
      }),
      this.prisma.jobPosting.count({ where }),
    ]);

    return {
      data: postings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, currentUser: CurrentUserInterface) {
    const posting = await this.prisma.jobPosting.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        recruiter: {
          select: {
            id: true,
            fullName: true,
            user: {
              select: {
                email: true
              }
            },
          },
        },
        applications: {
          include: {
            candidate: true,
            profile: true,
          },
        },
      },
    });

    if (!posting) {
      throw new NotFoundException(`Job posting with ID ${id} not found`);
    }

    return posting;
  }

  async update(id: number, dto: UpdateJobPostingDto, currentUser: CurrentUserInterface) {
    this.checkRecruiterRole(currentUser);
    
    const posting = await this.findOne(id, currentUser);
    
    // Check ownership
    if (posting.recruiterId !== currentUser.profile?.id && currentUser.role !== Role.HR_ADMIN) {
      throw new ForbiddenException('You can only update your own job postings');
    }

    const data: any = { ...dto };
    
    if (dto.salaryRange) {
      data.salaryRange = dto.salaryRange;
    }

    return this.prisma.jobPosting.update({
      where: { id },
      data,
      include: {
        recruiter: true,
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });
  }

  async publish(id: number, currentUser: CurrentUserInterface) {
    this.checkRecruiterRole(currentUser);
    
    const posting = await this.findOne(id, currentUser);
    
    if (posting.recruiterId !== currentUser.profile?.id && currentUser.role !== Role.HR_ADMIN) {
      throw new ForbiddenException('You can only publish your own job postings');
    }

    return this.prisma.jobPosting.update({
      where: { id },
      data: {
        status: PostingStatus.OPEN,
        publishedAt: new Date(),
      },
    });
  }

  async pause(id: number, currentUser: CurrentUserInterface) {
    this.checkRecruiterRole(currentUser);
    
    const posting = await this.findOne(id, currentUser);
    
    if (posting.recruiterId !== currentUser.profile?.id && currentUser.role !== Role.HR_ADMIN) {
      throw new ForbiddenException('Unauthorized');
    }

    return this.prisma.jobPosting.update({
      where: { id },
      data: {
        status: PostingStatus.PAUSED,
      },
    });
  }

  async close(id: number, currentUser: CurrentUserInterface) {
    this.checkRecruiterRole(currentUser);
    
    const posting = await this.findOne(id, currentUser);
    
    if (posting.recruiterId !== currentUser.profile?.id && currentUser.role !== Role.HR_ADMIN) {
      throw new ForbiddenException('Unauthorized');
    }

    return this.prisma.jobPosting.update({
      where: { id },
      data: {
        status: PostingStatus.CLOSED,
      },
    });
  }

  async softDelete(id: number, currentUser: CurrentUserInterface) {
    this.checkRecruiterRole(currentUser);
    
    const posting = await this.findOne(id, currentUser);
    
    if (posting.recruiterId !== currentUser.profile?.id && currentUser.role !== Role.HR_ADMIN) {
      throw new ForbiddenException('You can only delete your own job postings');
    }

    await this.prisma.jobPosting.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    this.logger.log(`Job posting ${id} soft deleted`);
  }

  private checkRecruiterRole(currentUser: CurrentUserInterface) {
    if (currentUser.role !== Role.RECRUITER && currentUser.role !== Role.HR_ADMIN) {
      throw new ForbiddenException('Only recruiters and HR admins can manage job postings');
    }
  }
}