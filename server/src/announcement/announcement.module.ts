import { Module } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { AnnouncementController } from './announcement.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ProfileModule } from '../profile/profile.module'; // To validate user role
import { AuthModule } from 'src/auth/auth.module';
import { CommunicationGateway } from 'src/communication/communication.gateway';

@Module({
  imports: [PrismaModule, ProfileModule, AuthModule],
  controllers: [AnnouncementController],
  providers: [AnnouncementService, CommunicationGateway],
})
export class AnnouncementModule {}