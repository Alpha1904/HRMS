import { Module } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { EvaluationController } from './evaluation.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { GoalModule } from '../goal/goal.module';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [
    PrismaModule, 
    GoalModule, // Used to create new goals during the evaluation process
    ProfileModule
  ],
  controllers: [EvaluationController],
  providers: [EvaluationService],
})
export class EvaluationModule {}