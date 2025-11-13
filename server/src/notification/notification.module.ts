import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LeaveNotificationListener } from './listeners/leave.listener';
import { AuthModule } from 'src/auth/auth.module';
import { ProfileModule } from '../profile/profile.module';
import { ShiftNotificationListener } from './listeners/shift.listener';

@Module({
  imports: [PrismaModule, AuthModule, ProfileModule],
  controllers: [NotificationController],
  providers: [LeaveNotificationListener,
    ShiftNotificationListener, NotificationService],
  exports: [NotificationService], 
})
export class NotificationModule {}