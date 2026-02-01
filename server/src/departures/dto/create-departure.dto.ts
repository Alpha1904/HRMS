import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DepartureType } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateDepartureDto {
  @ApiProperty({ example: 10, description: 'Employee Profile ID' })
  @IsInt()
  @Min(1)
  profileId: number;

  @ApiProperty({ enum: DepartureType, example: DepartureType.RESIGNATION })
  @IsEnum(DepartureType)
  type: DepartureType;

  @ApiPropertyOptional({ example: 'Relocating to another city' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ example: '2026-02-01T00:00:00.000Z' })
  @IsDateString()
  noticeDate: string;

  @ApiProperty({ example: '2026-03-02T00:00:00.000Z' })
  @IsDateString()
  lastWorkDate: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(0)
  requiredNoticeDays?: number;
}
