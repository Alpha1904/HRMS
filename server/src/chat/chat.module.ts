import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [JwtModule.register({}), PrismaModule],
  providers: [ChatService, ChatGateway, WsJwtGuard],
  controllers: [ChatController],
})
export class ChatModule {}
