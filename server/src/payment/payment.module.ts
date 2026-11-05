import { Module } from '@nestjs/common';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProfileModule } from '../profile/profile.module';
import { PaymentController } from './payment.controller';
import { AdjustmentService } from './services/adjustment.service';
import { CompensationService } from './services/compensation.service';
import { PaymentAuditService } from './services/payment-audit.service';
import { PayslipService } from './services/payslip.service';

@Module({
  imports: [PrismaModule, AuthModule, ProfileModule, NestScheduleModule.forRoot()],
  controllers: [PaymentController],
  providers: [
    CompensationService,
    AdjustmentService,
    PayslipService,
    PaymentAuditService,
  ],
  exports: [CompensationService, AdjustmentService, PayslipService],
})
export class PaymentModule {}
