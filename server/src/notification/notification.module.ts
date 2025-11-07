import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LeaveNotificationListener } from './listeners/leave.listener';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [NotificationController],
  providers: [LeaveNotificationListener, NotificationService],
  // We MUST export the service so other modules (like LeaveModule) can use it.
  exports: [NotificationService], 
})
export class NotificationModule {}