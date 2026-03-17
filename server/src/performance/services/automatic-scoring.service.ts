import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EvaluationCriteriaService } from './evaluation-criteria.service';
import {
  AuditContext,
  PerformanceAuditService,
} from './performance-audit.service';

@Injectable()
export class AutomaticScoringService {
  constructor(
    private prisma: PrismaService,
    private criteriaService: EvaluationCriteriaService,
    private audit: PerformanceAuditService,
  ) {}

  private clampScore(n: number) {
    if (n < 0) return 0;
    if (n > 100) return 100;
    return n;
  }

  async getCriteriaBreakdown(
    evaluationId: number,
    currentUser: { tenantId?: string },
  ) {
    const evaluation = await this.prisma.performanceEvaluation.findUnique({
      where: { id: evaluationId },
      include: { employee: true, cycle: true },
    });

    if (!evaluation) throw new NotFoundException('Evaluation not found');

    if (
      currentUser.tenantId &&
      evaluation.tenantId &&
      currentUser.tenantId !== evaluation.tenantId
    ) {
      throw new ForbiddenException('Cross-tenant read denied');
    }

    const breakdown: any = {};

    const attendanceLeaves = await this.prisma.leave.findMany({
      where: {
        profileId: evaluation.employeeId,
        startDate: {
          gte: evaluation.cycle.startDate,
          lte: evaluation.cycle.endDate,
        },
        status: 'APPROVED',
      },
      select: { daysRequested: true },
    });

    const totalDays = Math.max(
      1,
      Math.ceil(
        (evaluation.cycle.endDate.getTime() -
          evaluation.cycle.startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );
    const absences = attendanceLeaves.reduce(
      (sum, l) => sum + (l.daysRequested ?? 1),
      0,
    );
    const absenceRate = absences / totalDays;
    const attendanceScore = this.clampScore(100 - absenceRate * 100);
    breakdown.attendance = {
      score: attendanceScore,
      details: { totalDays, absences, absenceRate },
    };

    const incidents = 0;
    const disciplineScore =
      incidents === 0 ? 100 : this.clampScore(100 - incidents * 20);
    breakdown.discipline = {
      score: disciplineScore,
      details: { incidents },
    };

    const objectives = await this.prisma.employeeObjective.findMany({
      where: {
        evaluationId: evaluation.id,
      },
      select: { status: true, weight: true },
    });

    const totalObjectives = objectives.length;
    const completedObjectives = objectives.filter(
      (o) => o.status === 'COMPLETED',
    );
    const totalCompletedObjectives = completedObjectives.length;
    const completedObjectivesWeightSum = completedObjectives.reduce(
      (acc, o) => acc + (o.weight ?? 0),
      0,
    );
    const objectivesWeightSum = objectives.reduce(
      (acc, o) => acc + (o.weight ?? 0),
      0,
    );
    const completionRate =
      totalObjectives === 0 ? 1 : completedObjectivesWeightSum / objectivesWeightSum;
    const taskScore = this.clampScore(completionRate * 100);

    breakdown.task = {
      score: taskScore,
      weight: objectivesWeightSum,
      details: {
        totalObjectives,
        completedObjectives: totalCompletedObjectives,
        completionRate,
        objectivesWeightSum,
      },
    };

    // Update task criteria weight in database with calculated value
    // Search for task criteria across all tenants
    const taskCriteria = await this.prisma.evaluationCriteria.findFirst({
      where: {
        name: { contains: 'task', mode: 'insensitive' },
        isActive: true,
      },
    });
    if (taskCriteria && objectivesWeightSum > 0) {
      await this.prisma.evaluationCriteria.update({
        where: { id: taskCriteria.id },
        data: { weight: objectivesWeightSum },
      });
    }

    return breakdown;
  }

  async calculateAutomaticScore(
    evaluationId: number,
    ctx: AuditContext,
    currentUser: { tenantId?: string },
  ) {
    const evaluation = await this.prisma.performanceEvaluation.findUnique({
      where: { id: evaluationId },
      include: { employee: true, cycle: true },
    });

    if (!evaluation) throw new NotFoundException('Evaluation not found');

    if (
      currentUser.tenantId &&
      evaluation.tenantId &&
      currentUser.tenantId !== evaluation.tenantId
    ) {
      throw new ForbiddenException('Cross-tenant calculate denied');
    }

    const tenantId = evaluation.tenantId ?? undefined;
    let criteria = await this.criteriaService.getCriteria({
      isActive: true,
      tenantId,
    });

    if (criteria.length === 0 && tenantId) {
      criteria = await this.criteriaService.getCriteria({ isActive: true });
    }

    if (criteria.length === 0) {
      throw new BadRequestException(
        `No active criteria configured${tenantId ? ` for tenant ${tenantId}` : ''}`,
      );
    }

    const totalWeight = criteria.reduce((sum, c) => sum + (c.weight ?? 0), 0);
    const epsilon = 0.001;
    if (Math.abs(totalWeight - 1) > epsilon) {
      throw new BadRequestException(
        `Criteria weights must sum to 1, but current sum is ${totalWeight.toFixed(3)}`,
      );
    }

    const breakdown: any = {};
    let weightedSum = 0;
    let weightSum = 0;

    for (const c of criteria) {
      const key = String(c.name).toLowerCase();

      if (key.includes('attendance')) {
        const leaves = await this.prisma.leave.findMany({
          where: {
            profileId: evaluation.employeeId,
            startDate: {
              gte: evaluation.cycle.startDate,
              lte: evaluation.cycle.endDate,
            },
            status: 'APPROVED',
          },
          select: { startDate: true, endDate: true, daysRequested: true },
        });

        const totalDays = Math.max(
          1,
          Math.ceil(
            (evaluation.cycle.endDate.getTime() -
              evaluation.cycle.startDate.getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        );
        const absences = leaves.reduce(
          (sum, l) => sum + (l.daysRequested ?? 1),
          0,
        );
        const absenceRate = absences / totalDays;
        const score = this.clampScore(100 - absenceRate * 100);

        breakdown[c.name] = {
          score,
          weight: c.weight,
          details: { totalDays, absences, absenceRate },
        };

        weightedSum += score * c.weight;
        weightSum += c.weight;
        continue;
      }

      if (key.includes('discipline')) {
        const incidents = 0;
        const score =
          incidents === 0 ? 100 : this.clampScore(100 - incidents * 20);

        breakdown[c.name] = {
          score,
          weight: c.weight,
          details: { incidents },
        };

        weightedSum += score * c.weight;
        weightSum += c.weight;
        continue;
      }

      if (key.includes('task') || key.includes('completion')) {
        const objectives = await this.prisma.employeeObjective.findMany({
          where: {
            evaluationId: evaluation.id,
            // createdAt: {
            //   gte: evaluation.cycle.startDate,
            //   lte: evaluation.cycle.endDate,
            // },
          },
          select: { status: true, weight: true },
        });

        const totalObjectives = objectives.length;
        const completedObjectives = objectives.filter(
          (o) => o.status === 'COMPLETED',
        );
        const totalCompletedObjectives = completedObjectives.length;

        const completedObjectivesWeightSum = completedObjectives.reduce(
          (acc, o) => acc + (o.weight ?? 0),
          0,
        );
        const objectivesWeightSum = objectives.reduce(
          (acc, o) => acc + (o.weight ?? 0),
          0,
        );

        const completionRate =
          totalObjectives === 0 ? 1 : completedObjectivesWeightSum / objectivesWeightSum;
        const score = this.clampScore(completionRate * 100);

        const effectiveWeight = objectivesWeightSum;

        // Update task criteria weight in database with calculated value
        // Also try to find and update task criteria that might not be in the filtered list
        if (effectiveWeight > 0) {
          if (c.id) {
            await this.prisma.evaluationCriteria.update({
              where: { id: c.id },
              data: { weight: effectiveWeight },
            });
          } else {
            // Fallback: find task criteria by name and update
            const taskCriteria = await this.prisma.evaluationCriteria.findFirst({
              where: {
                name: { contains: 'task', mode: 'insensitive' },
                isActive: true,
              },
            });
            if (taskCriteria) {
              await this.prisma.evaluationCriteria.update({
                where: { id: taskCriteria.id },
                data: { weight: effectiveWeight },
              });
            }
          }
        }

        breakdown[c.name] = {
          score,
          weight: effectiveWeight,
          details: {
            totalObjectives,
            completedObjectives: totalCompletedObjectives,
            completionRate,
            objectivesWeightSum: effectiveWeight,
            criteriaWeightConfigured: c.weight,
          },
        };

        weightedSum += score * effectiveWeight;
        weightSum += effectiveWeight;
        continue;
      }

      const score = 100;
      breakdown[c.name] = { score, weight: c.weight, details: {} };
      weightedSum += score * c.weight;
      weightSum += c.weight;
    }

    if (weightSum <= 0) {
      throw new BadRequestException('No effective criteria weights available for scoring');
    }

    const totalScore = weightedSum / weightSum;
    breakdown.totalScore = totalScore;

    const upserted = await this.prisma.evaluationScore.upsert({
      where: { evaluationId },
      create: { evaluationId, totalScore, breakdown },
      update: { totalScore, breakdown, generatedAt: new Date() },
    });

    await this.audit.log(
      ctx,
      'CALCULATE_AUTOMATIC_SCORE',
      'PerformanceEvaluation',
      evaluationId,
      undefined,
      {
        totalScore,
      },
    );

    if (evaluation.status === 'DRAFT') {
      await this.prisma.performanceEvaluation.update({
        where: { id: evaluationId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return upserted;
  }

  async recalculateAllScores(
    cycleId: number,
    ctx: AuditContext,
    currentUser: { tenantId?: string },
  ) {
    const cycle = await this.prisma.evaluationCycle.findUnique({
      where: { id: cycleId },
    });
    if (!cycle || cycle.deletedAt)
      throw new NotFoundException('Cycle not found');

    if (
      currentUser.tenantId &&
      cycle.tenantId &&
      currentUser.tenantId !== cycle.tenantId
    ) {
      throw new ForbiddenException('Cross-tenant calculate denied');
    }

    const evaluations = await this.prisma.performanceEvaluation.findMany({
      where: { cycleId },
      select: { id: true },
    });

    await this.prisma.$transaction(async (tx) => {
      for (const e of evaluations) {
        const criteria = await this.criteriaService.getCriteria({
          isActive: true,
          tenantId: cycle.tenantId ?? undefined,
        });
        if (criteria.length === 0) continue;
        await tx.evaluationScore.deleteMany({ where: { evaluationId: e.id } });
      }
    });

    let count = 0;
    for (const e of evaluations) {
      await this.calculateAutomaticScore(e.id, ctx, currentUser);
      count++;
    }

    await this.audit.log(
      ctx,
      'CALCULATE_ALL_AUTOMATIC',
      'EvaluationCycle',
      cycleId,
      undefined,
      { count },
    );

    return {
      message: `Recalculated ${count} evaluations for cycle ${cycleId}`,
      count,
    };
  }

  async getScoreBreakdown(
    evaluationId: number,
    currentUser: { tenantId?: string },
  ) {
    const score = await this.prisma.evaluationScore.findUnique({
      where: { evaluationId },
    });
    if (!score) throw new NotFoundException('Automatic score not found');

    const evaluation = await this.prisma.performanceEvaluation.findUnique({
      where: { id: evaluationId },
    });
    if (
      currentUser.tenantId &&
      evaluation?.tenantId &&
      currentUser.tenantId !== evaluation.tenantId
    ) {
      throw new ForbiddenException('Cross-tenant read denied');
    }

    return score.breakdown;
  }
}
