import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EvaluationCriteriaService } from './evaluation-criteria.service';
import { AuditContext, PerformanceAuditService } from './performance-audit.service';

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

  async calculateAutomaticScore(evaluationId: number, ctx: AuditContext, currentUser: { tenantId?: string }) {
    const evaluation = await this.prisma.performanceEvaluation.findUnique({
      where: { id: evaluationId },
      include: { employee: true, cycle: true },
    });

    if (!evaluation) throw new NotFoundException('Evaluation not found');

    if (currentUser.tenantId && evaluation.tenantId && currentUser.tenantId !== evaluation.tenantId) {
      throw new ForbiddenException('Cross-tenant calculate denied');
    }

    await this.criteriaService.assertWeightsSumToOneOrThrow(evaluation.tenantId ?? undefined);

    const criteria = await this.criteriaService.getCriteria({
      isActive: true,
      tenantId: evaluation.tenantId ?? undefined,
    });

    if (criteria.length === 0) {
      throw new BadRequestException('No active criteria configured');
    }

    const breakdown: any = {};
    let totalScore = 0;

    for (const c of criteria) {
      const key = String(c.name).toLowerCase();

      if (key.includes('attendance')) {
        const leaves = await this.prisma.leave.findMany({
          where: {
            profileId: evaluation.employeeId,
            startDate: { gte: evaluation.cycle.startDate, lte: evaluation.cycle.endDate },
            status: 'APPROVED',
          },
          select: { startDate: true, endDate: true, daysRequested: true },
        });

        const totalDays = Math.max(1, Math.ceil((evaluation.cycle.endDate.getTime() - evaluation.cycle.startDate.getTime()) / (1000 * 60 * 60 * 24)));
        const absences = leaves.reduce((sum, l) => sum + (l.daysRequested ?? 1), 0);
        const absenceRate = absences / totalDays;
        const score = this.clampScore(100 - absenceRate * 100);

        breakdown[c.name] = {
          score,
          weight: c.weight,
          details: { totalDays, absences, absenceRate },
        };

        totalScore += score * c.weight;
        continue;
      }

      if (key.includes('discipline')) {
        const incidents = 0;
        const score = incidents === 0 ? 100 : this.clampScore(100 - incidents * 20);

        breakdown[c.name] = {
          score,
          weight: c.weight,
          details: { incidents },
        };

        totalScore += score * c.weight;
        continue;
      }

      if (key.includes('task') || key.includes('completion')) {
        const goals = await this.prisma.goal.findMany({
          where: {
            profileId: evaluation.employeeId,
            createdAt: { gte: evaluation.cycle.startDate, lte: evaluation.cycle.endDate },
          },
          select: { status: true },
        });

        const total = goals.length;
        const completed = goals.filter((g) => g.status === 'COMPLETED').length;
        const completionRate = total === 0 ? 1 : completed / total;
        const score = this.clampScore(completionRate * 100);

        breakdown[c.name] = {
          score,
          weight: c.weight,
          details: { totalGoals: total, completedGoals: completed, completionRate },
        };

        totalScore += score * c.weight;
        continue;
      }

      const score = 100;
      breakdown[c.name] = { score, weight: c.weight, details: {} };
      totalScore += score * c.weight;
    }

    breakdown.totalScore = totalScore;

    const upserted = await this.prisma.evaluationScore.upsert({
      where: { evaluationId },
      create: { evaluationId, totalScore, breakdown },
      update: { totalScore, breakdown, generatedAt: new Date() },
    });

    await this.audit.log(ctx, 'CALCULATE_AUTOMATIC_SCORE', 'PerformanceEvaluation', evaluationId, undefined, {
      totalScore,
    });

    if (evaluation.status === 'DRAFT') {
      await this.prisma.performanceEvaluation.update({
        where: { id: evaluationId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return upserted;
  }

  async recalculateAllScores(cycleId: number, ctx: AuditContext, currentUser: { tenantId?: string }) {
    const cycle = await this.prisma.evaluationCycle.findUnique({ where: { id: cycleId } });
    if (!cycle || cycle.deletedAt) throw new NotFoundException('Cycle not found');

    if (currentUser.tenantId && cycle.tenantId && currentUser.tenantId !== cycle.tenantId) {
      throw new ForbiddenException('Cross-tenant calculate denied');
    }

    const evaluations = await this.prisma.performanceEvaluation.findMany({
      where: { cycleId },
      select: { id: true },
    });

    await this.prisma.$transaction(async (tx) => {
      for (const e of evaluations) {
        const criteria = await this.criteriaService.getCriteria({ isActive: true, tenantId: cycle.tenantId ?? undefined });
        if (criteria.length === 0) continue;
        await tx.evaluationScore.deleteMany({ where: { evaluationId: e.id } });
      }
    });

    let count = 0;
    for (const e of evaluations) {
      await this.calculateAutomaticScore(e.id, ctx, currentUser);
      count++;
    }

    await this.audit.log(ctx, 'CALCULATE_ALL_AUTOMATIC', 'EvaluationCycle', cycleId, undefined, { count });

    return { message: `Recalculated ${count} evaluations for cycle ${cycleId}`, count };
  }

  async getScoreBreakdown(evaluationId: number, currentUser: { tenantId?: string }) {
    const score = await this.prisma.evaluationScore.findUnique({ where: { evaluationId } });
    if (!score) throw new NotFoundException('Automatic score not found');

    const evaluation = await this.prisma.performanceEvaluation.findUnique({ where: { id: evaluationId } });
    if (currentUser.tenantId && evaluation?.tenantId && currentUser.tenantId !== evaluation.tenantId) {
      throw new ForbiddenException('Cross-tenant read denied');
    }

    return score.breakdown;
  }
}
