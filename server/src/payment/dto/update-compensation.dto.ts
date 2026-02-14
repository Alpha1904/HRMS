import { ApiPropertyOptional } from '@nestjs/swagger';
import { CompensationType, Frequency } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateCompensationDto {
  @IsEnum(CompensationType)
  @IsOptional()
  @ApiPropertyOptional({ enum: CompensationType })
  type?: CompensationType;

  @IsNumber()
  @Min(0.01)
  @IsOptional()
  @ApiPropertyOptional({ example: 2500.0 })
  amount?: number;

  @IsEnum(Frequency)
  @IsOptional()
  @ApiPropertyOptional({ enum: Frequency, nullable: true })
  frequency?: Frequency | null;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional({ example: '2026-02-01' })
  startDate?: string;

  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional({ example: '2026-12-01', nullable: true })
  endDate?: string | null;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ example: true })
  active?: boolean;
}
