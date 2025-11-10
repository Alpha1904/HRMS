import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ProfileModule } from '../profile/profile.module';
import { MessageGateway } from './message.gateway';
import { CommunicationGateway } from 'src/communication/communication.gateway';

@Module({
  imports: [
    PrismaModule,
    ProfileModule, // We need this to check manager/HR relationships
  ],
  controllers: [MessageController],
  providers: [MessageService, MessageGateway, CommunicationGateway],
  exports: [MessageService],
})
export class MessageModule {}