import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateAdjustmentDto {
  @IsInt()
  @IsOptional()
  @ApiPropertyOptional({ example: 123, nullable: true, description: 'Set to null to clear the component link' })
  componentId?: number | null;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'INCREASE' })
  adjustmentType?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional({ example: 1000 })
  amount?: number;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ example: 10, nullable: true })
  percentage?: number | null;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ nullable: true })
  reason?: string | null;

  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional({ example: '2026-02-01' })
  effectiveDate?: string;
}
