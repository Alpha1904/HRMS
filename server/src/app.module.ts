import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ThrottlerModule } from '@nestjs/throttler/dist/throttler.module';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from './email/email.module';
import { DocumentModule } from './document/document.module';

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
    DocumentModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
