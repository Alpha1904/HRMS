import {
  IsInt,
  IsDateString,
  IsString,
  Matches,
  IsOptional,
  IsArray, ArrayNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShiftDto {
  @ApiProperty({
    description: 'An array of Profile IDs to assign this shift to.',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  profileIds: number[]; // Array of Profile IDs to assign this shift to

  @ApiProperty({
    description: 'The date of the shift in YYYY-MM-DD format.',
    example: '2025-12-10',
  })
  @IsDateString()
  date: string; // e.g., "2025-12-10"

  @ApiProperty({
    description: 'The start time of the shift in HH:MM format (24-hour).',
    example: '09:00',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:MM format',
  })
  startTime: string; // e.g., "09:00"

  @ApiProperty({
    description: 'The end time of the shift in HH:MM format (24-hour).',
    example: '17:00',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in HH:MM format',
  })
  endTime: string; // e.g., "17:00"

  @ApiProperty({
    description: 'Optional ID of the work schedule template this shift is based on.',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  templateId?: number;
}