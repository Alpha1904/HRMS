import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEvaluationDto, CreateSelfEvaluationDto } from './dto/create-evaluation.dto';
import { Evaluation, Prisma } from '@prisma/client';
import { GoalService } from '../goal/goal.service';
import { ProfileService } from '../profile/profile.service';

@Injectable()
export class EvaluationService {
  constructor(
    private prisma: PrismaService,
    private goalService: GoalService,
    private profileService: ProfileService,
  ) {}

  /**
   * Creates a new Evaluation (used by manager or for self-evaluation)
   */
  async create(dto: CreateEvaluationDto | CreateSelfEvaluationDto, selfEval: boolean): Promise<Evaluation> {
    const { newGoals, ...evaluationData } = dto;
    
    // 1. Role Validation (For Manager Reviews only)
    if (!selfEval && evaluationData.evaluatorId) {
        const profile = await this.profileService.findOne(evaluationData.profileId);
        if (profile.managerId !== evaluationData.evaluatorId) {
            throw new ForbiddenException('Only the direct manager can submit this evaluation.');
        }
    }

    // 2. Create the Evaluation record
    const createdEvaluation = await this.prisma.evaluation.create({
      data: {
        ...evaluationData,
        // Ensure the selfEval flag is set correctly based on the endpoint context
        selfEval: selfEval,
        // No cast is needed; Prisma handles JsonObject directly.
        scores: evaluationData.scores,
      },
    });

    // 3. Goal Integration: If newGoals are provided, create them and link them to the Evaluation
    if (newGoals && newGoals.length > 0) {
      for (const goalDto of newGoals) {
        // Enforce the goal ownership and link to the newly created evaluation
        await this.goalService.create({
          ...goalDto,
          profileId: createdEvaluation.profileId, 
          createdInEvaluationId: createdEvaluation.id,
        });
      }
    }

    // 4. Return the full Evaluation, including relations for confirmation
    const fullEvaluation = await this.prisma.evaluation.findUnique({
        where: { id: createdEvaluation.id },
        include: { goalsSet: true, profile: true },
    });

    if (!fullEvaluation) {
      throw new NotFoundException(`Could not retrieve the newly created evaluation with ID ${createdEvaluation.id}.`);
    }

    return fullEvaluation;
  }

  /**
   * Retrieves evaluations based on profile and period.
   */
  async findEvaluations(profileId?: number, evaluatorId?: number, period?: string): Promise<Evaluation[]> {
    const where: Prisma.EvaluationWhereInput = {};

    if (profileId) {
      where.profileId = profileId;
    }
    if (evaluatorId) {
      where.evaluatorId = evaluatorId;
    }
    if (period) {
      where.period = period as any; // Cast safely for Prisma filter
    }

    return this.prisma.evaluation.findMany({
      where,
      include: { 
        profile: { select: { fullName: true } }, 
        goalsSet: { orderBy: { targetDate: 'asc' } } 
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  
  // Note: Update/Delete methods would follow standard CRUD patterns here.
  // We prioritize Create/Read for initial module implementation.
}