import { ApiPropertyOptional } from '@nestjs/swagger';
import { DepartureType } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateDepartureDto {
  @ApiPropertyOptional({ enum: DepartureType })
  @IsOptional()
  @IsEnum(DepartureType)
  type?: DepartureType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: '2026-02-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  noticeDate?: string;

  @ApiPropertyOptional({ example: '2026-03-02T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  lastWorkDate?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(0)
  requiredNoticeDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  actualNoticeDays?: number;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @IsNumber()
  severancePay?: number;

  @ApiPropertyOptional({ example: { base: 1000, bonus: 500, total: 1500 } })
  @IsOptional()
  severanceBreakdown?: any;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  severanceApproved?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
