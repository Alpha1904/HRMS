import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

@Injectable()
export class CandidateService {
  private readonly logger = new Logger(CandidateService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCandidateDto) {
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

  async findAll(filters: any) {
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

  async findOne(id: number) {
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

  async update(id: number, dto: UpdateCandidateDto) {
    await this.findOne(id);

    return this.prisma.candidate.update({
      where: { id },
      data: dto,
    });
  }

  async findDocuments(id: number) {
    await this.findOne(id); // Verify candidate exists
    
    return this.prisma.document.findMany({
      where: {
        candidateId: id,
        deletedAt: null,
      },
      orderBy: {
        uploadDate: 'desc',
      },
    });
  }

  async deactivate(id: number) {
    await this.findOne(id);

    return this.prisma.candidate.update({
      where: { id },
      data: {
        status: 'INACTIVE',
      },
    });
  }
}