import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShiftChangeRequestDto {
  @ApiProperty({
    description: 'Reason for requesting the shift change.',
    example: 'Personal appointment',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'New date for the shift in YYYY-MM-DD format.',
    example: '2025-12-20',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  newDate?: string;

  @ApiProperty({
    description: 'New start time in HH:MM format (24-hour).',
    example: '14:00',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'newStartTime must be in HH:MM format',
  })
  newStartTime?: string;

  @ApiProperty({
    description: 'New end time in HH:MM format (24-hour).',
    example: '22:00',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'newEndTime must be in HH:MM format',
  })
  newEndTime?: string;
}
