import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { Goal, GoalStatus, Prisma } from '@prisma/client';

@Injectable()
export class GoalService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new goal. Typically called during a review submission.
   */
  async create(dto: CreateGoalDto): Promise<Goal> {
    // Basic validation to ensure profile exists
    const profile = await this.prisma.profile.findUnique({
        where: { id: dto.profileId }
    });
    if (!profile) {
        throw new NotFoundException(`Profile with ID ${dto.profileId} not found.`);
    }

    return this.prisma.goal.create({
      data: {
        ...dto,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
      },
    });
  }

  /**
   * Retrieves all goals for a specific employee, filterable by status.
   */
  async findEmployeeGoals(profileId: number, status?: GoalStatus): Promise<Goal[]> {
    const where: Prisma.GoalWhereInput = {
      profileId,
    };
    if (status) {
      where.status = status;
    }

    return this.prisma.goal.findMany({
      where,
      orderBy: { targetDate: 'asc' },
    });
  }

  /**
   * Retrieves a single goal by ID.
   */
  async findOne(id: number): Promise<Goal> {
    const goal = await this.prisma.goal.findUnique({ where: { id } });
    if (!goal) {
      throw new NotFoundException(`Goal with ID ${id} not found.`);
    }
    return goal;
  }

  /**
   * Updates a goal's progress, status, or title.
   * NOTE: This is the core tracking method.
   */
  async update(id: number, dto: UpdateGoalDto, currentProfileId: number): Promise<Goal> {
    const goal = await this.prisma.goal.findUnique({ where: { id } });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${id} not found.`);
    }

    // Security check: Only the owner or a manager of the owner can update the goal
    // We'll rely on the controller to pass currentProfileId (the updater)
    const goalOwner = await this.prisma.profile.findUnique({
        where: { id: goal.profileId },
        select: { managerId: true }
    });
    
    // Simplistic authorization check: Must be the goal owner OR the owner's manager
    if (goal.profileId !== currentProfileId && goalOwner?.managerId !== currentProfileId) {
        throw new ForbiddenException('You do not have permission to update this goal.');
    }

    // Logic for COMPLETED status: If status is COMPLETED, progress should be 100%
    if (dto.status === 'COMPLETED' && (dto.progress === undefined || dto.progress !== 100)) {
        dto.progress = 100;
    }
    
    // Logic for progress update: If progress hits 100, set status to COMPLETED
    if (dto.progress === 100 && (dto.status === undefined || dto.status !== 'COMPLETED')) {
        dto.status = GoalStatus.COMPLETED;
    }


    try {
      return this.prisma.goal.update({
        where: { id },
        data: {
            ...dto,
            targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
        },
      });
    } catch (error) {
       if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            throw new NotFoundException(`Goal with ID ${id} not found.`);
       }
       throw error;
    }
  }

  /**
   * Deletes a goal.
   */
  async remove(id: number): Promise<Goal> {
    try {
      return await this.prisma.goal.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Goal with ID ${id} not found.`);
      }
      throw error;
    }
  }
}