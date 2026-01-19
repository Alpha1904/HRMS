import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EvaluationPeriod } from '@prisma/client';
import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateEvaluationCycleDto {
  @ApiProperty({ example: 'Q1 2026 Performance Review', description: 'Human-friendly name of the evaluation cycle' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @ApiProperty({ enum: EvaluationPeriod, example: EvaluationPeriod.QUARTERLY, description: 'Evaluation period classification' })
  @IsIn(Object.values(EvaluationPeriod))
  period: EvaluationPeriod;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-01-01T00:00:00.000Z', description: 'Cycle start date (ISO 8601)' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-03-31T23:59:59.000Z', description: 'Cycle end date (ISO 8601)' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: 'tenant_123', description: 'Tenant identifier (optional if derived from the authenticated user)' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
