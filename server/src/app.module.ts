import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ThrottlerModule } from '@nestjs/throttler/dist/throttler.module';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from './email/email.module';
import { UserModule } from './user/user.module';
import { ProfileModule } from './profile/profile.module';
import { ManagerModule } from './manager/manager.module';
import { LeaveModule } from './leave/leave.module';
import { LeavePolicyModule } from './leave-policy/leave-policy.module';
import { NotificationModule } from './notification/notification.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from './schedule/schedule.module';
import { ShiftRequestModule } from './shift-request/shift-request.module';
import { GoalModule } from './goal/goal.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { MessageModule } from './message/message.module';
import { AnnouncementModule } from './announcement/announcement.module';
import { ForumModule } from './forum/forum.module';

@Module({
  imports: [UserModule, PrismaModule, AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 5,
      },
    ]),
    EventEmitterModule.forRoot(),
    EmailModule,
    ProfileModule,
    ManagerModule,
    LeaveModule,
    LeavePolicyModule,
    NotificationModule,
    ScheduleModule,
    ShiftRequestModule,
    GoalModule,
    EvaluationModule,
    MessageModule,
    AnnouncementModule,
    ForumModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
