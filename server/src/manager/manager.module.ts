import { Module } from '@nestjs/common';
import { ManagerController } from './manager.controller';
import { ProfileModule } from '../profile/profile.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ProfileModule, // Import ProfileModule to gain access to ProfileService
  ],
  controllers: [ManagerController],
  providers: [], // No new providers needed
})
export class ManagerModule {}