import { Module } from '@nestjs/common';
import { ForumService } from './forum.service';
import { ForumController } from './forum.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ProfileModule } from '../profile/profile.module';
import { CommunicationGateway } from 'src/communication/communication.gateway';

@Module({
  imports: [PrismaModule, ProfileModule],
  controllers: [ForumController],
  providers: [ForumService, CommunicationGateway],
})
export class ForumModule {}