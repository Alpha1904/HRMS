import {
  IsOptional,
  IsString,
  Matches,
  IsInt,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateShiftDto {
  @ApiProperty({
    description: 'The new date of the shift in YYYY-MM-DD format.',
    example: '2025-12-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({
    description: 'The new start time in HH:MM format (24-hour).',
    example: '10:00',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:MM format',
  })
  startTime?: string;

  @ApiProperty({
    description: 'The new end time in HH:MM format (24-hour).',
    example: '18:00',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in HH:MM format',
  })
  endTime?: string;

  @ApiProperty({
    description: 'Optional new work schedule template ID. Set to null to remove template.',
    example: 2,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  templateId?: number | null;
}
