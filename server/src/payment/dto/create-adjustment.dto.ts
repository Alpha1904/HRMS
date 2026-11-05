import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateAdjustmentDto {
  @ApiProperty({ example: 10, description: 'Employee Profile ID' })
  @IsInt()
  @Min(1)
  profileId: number;

  @ApiPropertyOptional({ example: 55, description: 'Optional CompensationComponent ID' })
  @IsOptional()
  @IsInt()
  @Min(1)
  componentId?: number;

  @ApiProperty({ example: 'INCREASE' })
  @IsString()
  adjustmentType: string;

  @ApiProperty({ example: 150.0 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 5, description: 'Percent adjustment, e.g. 5 for 5%' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  percentage?: number;

  @ApiPropertyOptional({ example: 'Performance bonus' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ example: '2026-02-01T00:00:00.000Z' })
  @IsDateString()
  effectiveDate: string;
}
