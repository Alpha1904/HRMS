import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompensationType, Frequency } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateCompensationDto {
  @ApiProperty({ example: 10, description: 'Employee Profile ID' })
  @IsInt()
  @Min(1)
  profileId: number;

  @ApiProperty({ enum: CompensationType, example: CompensationType.BASE_SALARY })
  @IsEnum(CompensationType)
  type: CompensationType;

  @ApiProperty({ example: 2500.0 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ enum: Frequency, example: Frequency.MONTHLY })
  @IsOptional()
  @IsEnum(Frequency)
  frequency?: Frequency;

  @ApiPropertyOptional({ example: 'Base salary' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2026-02-01T00:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2026-12-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
