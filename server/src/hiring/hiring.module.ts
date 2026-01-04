import { Module } from '@nestjs/common';
import { JobPostingController } from './job-posting/job-posting.controller';
import { JobPostingService } from './job-posting/job-posting.service';
import { CandidateController } from './candidate/candidate.controller';
import { ApplicationController } from './application/application.controller';
import { ApplicationService } from './application/application.service';
import { InteractionController } from './interaction/interaction.controller';
import { InteractionService } from './interaction/interaction.service';
import { DocumentsModule } from '../documents/documents.module';
import { NotificationModule } from 'src/notification/notification.module';
import { CandidateService } from './candidate/candidate.service';

@Module({
  imports: [DocumentsModule, NotificationModule],
  controllers: [
    JobPostingController,
    CandidateController,
    ApplicationController,
    InteractionController,
  ],
  providers: [
    JobPostingService,
    CandidateService,
    ApplicationService,
    InteractionService,
  ],
})
export class HiringModule {}
