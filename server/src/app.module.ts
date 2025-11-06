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
    EmailModule,
    ProfileModule,
    ManagerModule,
    LeaveModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
