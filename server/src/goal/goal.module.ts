import { Module } from '@nestjs/common';
import { GoalService } from './goal.service';
import { GoalController } from './goal.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [
    PrismaModule, 
    ProfileModule // Needed to validate profile ownership and existence
  ],
  controllers: [GoalController],
  providers: [GoalService],
  exports: [GoalService] // Export if other services (like Evaluation) need to create goals
})
export class GoalModule {}