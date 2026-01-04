import { Injectable, NotFoundException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { CurrentUserInterface } from '../../common/interfaces/current-user.interface';

@Injectable()
export class CandidateService {
  private readonly logger = new Logger(CandidateService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCandidateDto, currentUser: CurrentUserInterface) {
    this.checkAccess(currentUser);

    // Check if email already exists
    const existing = await this.prisma.candidate.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Candidate with this email already exists');
    }

    const candidate = await this.prisma.candidate.create({
      data: {
        ...dto,
        status: 'ACTIVE',
      },
    });

    this.logger.log(`Candidate created: ${candidate.id}`);
    return candidate;
  }

  async findAll(filters: any, currentUser: CurrentUserInterface) {
    this.checkAccess(currentUser);

    const { email, fullName, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * parseInt(limit);

    const where: any = {};

    if (email) {
      where.email = { contains: email, mode: 'insensitive' };
    }

    if (fullName) {
      where.fullName = { contains: fullName, mode: 'insensitive' };
    }

    const [candidates, total] = await Promise.all([
      this.prisma.candidate.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          _count: {
            select: {
              applications: true,
            },
          },
        },
      }),
      this.prisma.candidate.count({ where }),
    ]);

    return {
      data: candidates,
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

    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: {
        applications: {
          include: {
            posting: true,
          },
        },
        documents: {
          where: {
            deletedAt: null,
          },
        },
      },
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${id} not found`);
    }

    return candidate;
  }

  async findByEmail(email: string) {
    return this.prisma.candidate.findUnique({
      where: { email },
    });
  }

  async update(id: number, dto: UpdateCandidateDto, currentUser: CurrentUserInterface) {
    this.checkAccess(currentUser);

    await this.findOne(id, currentUser);

    return this.prisma.candidate.update({
      where: { id },
      data: dto,
    });
  }

  async deactivate(id: number, currentUser: CurrentUserInterface) {
    this.checkAccess(currentUser);

    await this.findOne(id, currentUser);

    return this.prisma.candidate.update({
      where: { id },
      data: {
        status: 'INACTIVE',
      },
    });
  }

  private checkAccess(currentUser: CurrentUserInterface) {
    if (currentUser.role !== Role.RECRUITER && currentUser.role !== Role.HR_ADMIN) {
      throw new ForbiddenException('Only recruiters and HR admins can manage candidates');
    }
  }
}