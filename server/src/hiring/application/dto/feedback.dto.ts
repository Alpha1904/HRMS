import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FeedbackDto {
  @ApiPropertyOptional({ example: 'Great candidate with strong technical skills' })
  @IsString()
  @IsOptional()
  feedback?: string;

  @ApiPropertyOptional({ example: 85, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  score?: number;
}