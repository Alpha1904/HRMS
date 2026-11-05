import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ProfileModule } from '../profile/profile.module';
import { NotificationModule } from '../notification/notification.module';
import { EvaluationCyclesController } from './controllers/evaluation-cycles.controller';
import { PerformanceEvaluationsController } from './controllers/performance-evaluations.controller';
import { SelfEvaluationsController } from './controllers/self-evaluations.controller';
import { ObjectivesController } from './controllers/objectives.controller';
import { EvaluationCyclesService } from './services/evaluation-cycles.service';
import { EvaluationCriteriaService } from './services/evaluation-criteria.service';
import { AutomaticScoringService } from './services/automatic-scoring.service';
import { ManualEvaluationsService } from './services/manual-evaluations.service';
import { SelfEvaluationsService } from './services/self-evaluations.service';
import { PerformanceAuditService } from './services/performance-audit.service';
import { EvaluationAccessGuard } from './guards/evaluation-access.guard';
import { EvaluationCriteriaController } from './controllers/evaluation-criteria.controller';
import { ManualEvaluationsController } from './controllers/manual-evaluations.controller';
import { RankingController } from './controllers/ranking.controller';
import { PerformanceEvaluationsService } from './services/performance-evaluations.service';
import { ObjectivesService } from './services/objectives.service';
import { RankingService } from './services/ranking.service';

@Module({
  imports: [CacheModule.register(), PrismaModule, AuthModule, ProfileModule, NotificationModule],
  controllers: [
    EvaluationCyclesController,
    EvaluationCriteriaController,
    PerformanceEvaluationsController,
    ManualEvaluationsController,
    SelfEvaluationsController,
    ObjectivesController,
    RankingController,
  ],
  providers: [
    EvaluationCyclesService,
    EvaluationCriteriaService,
    PerformanceEvaluationsService,
    AutomaticScoringService,
    ManualEvaluationsService,
    SelfEvaluationsService,
    ObjectivesService,
    RankingService,
    PerformanceAuditService,
    EvaluationAccessGuard,
  ],
  exports: [
    EvaluationCyclesService,
    EvaluationCriteriaService,
    PerformanceEvaluationsService,
    AutomaticScoringService,
    ManualEvaluationsService,
    SelfEvaluationsService,
    ObjectivesService,
    RankingService,
  ],
})
export class PerformanceModule {}
