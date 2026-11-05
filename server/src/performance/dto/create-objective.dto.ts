import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ObjectiveStatus } from '@prisma/client';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateObjectiveDto {
  @ApiProperty({ example: 'Increase customer satisfaction', description: 'Objective title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Improve response time and quality of customer support', description: 'Optional objective description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'CSAT >= 4.5', description: 'Optional target/measurement value for the objective' })
  @IsOptional()
  @IsString()
  targetValue?: string;

  @ApiPropertyOptional({ enum: ObjectiveStatus, default: ObjectiveStatus.NOT_STARTED, example: ObjectiveStatus.NOT_STARTED, description: 'Objective status' })
  @IsOptional()
  @IsIn(Object.values(ObjectiveStatus))
  status?: ObjectiveStatus;

  @ApiPropertyOptional({ minimum: 0, maximum: 1, example: 0.25, description: 'Objective weight within an evaluation (0..1). Total objective weights must not exceed 1.0' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  weight?: number;
}
