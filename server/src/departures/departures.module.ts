import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ProfileModule } from '../profile/profile.module';
import { NotificationModule } from '../notification/notification.module';
import { DeparturesController } from './controllers/departures.controller';
import { ExitInterviewsController } from './controllers/exit-interviews.controller';
import { ExitSurveysController } from './controllers/exit-surveys.controller';
import { ChecklistsController } from './controllers/checklists.controller';
import { HandoversController } from './controllers/handovers.controller';
import { DepartureDocumentsController } from './controllers/documents.controller';
import { DeparturesService } from './services/departures.service';
import { ExitInterviewsService } from './services/exit-interviews.service';
import { ExitSurveysService } from './services/exit-surveys.service';
import { ChecklistsService } from './services/checklists.service';
import { HandoversService } from './services/handovers.service';
import { DepartureDocumentsService } from './services/documents.service';
import { DepartureAccessGuard } from './guards/departure-access.guard';

@Module({
  imports: [PrismaModule, AuthModule, ProfileModule, NotificationModule],
  controllers: [
    DeparturesController,
    ExitInterviewsController,
    ExitSurveysController,
    ChecklistsController,
    HandoversController,
    DepartureDocumentsController,
  ],
  providers: [
    DeparturesService,
    ExitInterviewsService,
    ExitSurveysService,
    ChecklistsService,
    HandoversService,
    DepartureDocumentsService,
    DepartureAccessGuard,
  ],
  exports: [DeparturesService],
})
export class DeparturesModule {}
