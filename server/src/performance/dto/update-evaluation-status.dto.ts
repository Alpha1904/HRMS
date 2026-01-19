import { ApiProperty } from '@nestjs/swagger';
import { EvaluationStatus } from '@prisma/client';
import { IsIn } from 'class-validator';

export class UpdateEvaluationStatusDto {
  @ApiProperty({ enum: EvaluationStatus, example: EvaluationStatus.COMPLETED, description: 'New evaluation status' })
  @IsIn(Object.values(EvaluationStatus))
  status: EvaluationStatus;
}
