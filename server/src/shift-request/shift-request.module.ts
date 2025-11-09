import { Module } from '@nestjs/common';
import { ShiftRequestService } from './shift-request.service';
import { ShiftRequestController } from './shift-request.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ScheduleModule } from '../schedule/schedule.module'; // To get ScheduleService
import { NotificationModule } from '../notification/notification.module'; // To get NotificationService
import { ProfileModule } from '../profile/profile.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    ScheduleModule, // To access ScheduleService (for shift validation)
    NotificationModule, // To access NotificationService (for events)
    ProfileModule, // To get manager/profile info
  ],
  controllers: [ShiftRequestController],
  providers: [ShiftRequestService],
})
export class ShiftRequestModule {}