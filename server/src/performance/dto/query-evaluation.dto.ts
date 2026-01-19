import { ApiPropertyOptional } from '@nestjs/swagger';
import { EvaluationStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class QueryEvaluationDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'finalScore', description: 'Sort field. Allowed values: createdAt, updatedAt, finalScore, status' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ enum: EvaluationStatus, isArray: true, example: [EvaluationStatus.IN_PROGRESS], description: 'Filter by one or more statuses (comma-separated or repeated query param)' })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : String(value).split(',')))
  status?: EvaluationStatus[];

  @ApiPropertyOptional({ example: 1, description: 'Filter by evaluation cycle id' })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  cycleId?: number;

  @ApiPropertyOptional({ example: 'Engineering', description: 'Filter by employee department (used by managers/HR)' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 10, description: 'Filter by employee profile id' })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  employeeId?: number;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
