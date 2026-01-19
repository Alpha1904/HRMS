import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateManualEvaluationDto {
  @ApiProperty({ example: 'Consistently delivers work on time and supports teammates', description: 'Reviewer notes on employee strengths' })
  @IsString()
  @IsNotEmpty()
  strengths: string;

  @ApiProperty({ example: 'Needs improvement in communication and documentation', description: 'Reviewer notes on employee weaknesses' })
  @IsString()
  @IsNotEmpty()
  weaknesses: string;

  @ApiPropertyOptional({ example: 'Delivered project X ahead of schedule', description: 'Optional achievements noted by reviewer' })
  @IsOptional()
  @IsString()
  achievements?: string;

  @ApiPropertyOptional({ example: 'Attend advanced communication training', description: 'Optional reviewer recommendations' })
  @IsOptional()
  @IsString()
  recommendations?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 100, example: 85, description: 'Optional manual score (0..100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number;
}
