import { IsDateString, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QueryShiftDto {
  @ApiProperty({
    description: 'Start date for filtering shifts (YYYY-MM-DD).',
    example: '2025-12-01',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate: string; // e.g., "2025-12-01"

  @ApiProperty({
    description: 'End date for filtering shifts (YYYY-MM-DD).',
    example: '2025-12-31',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate: string; // e.g., "2025-12-31"

  @ApiProperty({
    description: 'Filter shifts by a specific employee Profile ID.',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  profileId?: number; // Filter by a single employee

  @ApiProperty({
    description: 'Filter shifts by all employees managed by a specific Manager Profile ID.',
    example: 5,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  managerId?: number; // Filter by all employees under a manager

  @ApiProperty({
    description: 'Filter shifts by a specific work schedule template ID.',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  templateId?: number; // Filter by a specific template
}