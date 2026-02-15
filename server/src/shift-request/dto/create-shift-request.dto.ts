import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  IsOptional,
  IsDateString,
  Matches,
} from 'class-validator';

export class CreateShiftRequestDto {
  @ApiProperty({
    description: 'The ID of the employee (Profile) making the request.',
    example: 15,
  })
  @IsInt()
  requesterId: number;

  @ApiProperty({
    description: 'The ID of the specific shift being requested for change.',
    example: 101,
  })
  @IsInt()
  shiftId: number;

  @ApiProperty({
    description: 'The reason for the shift change request.',
    example: 'I have a doctor appointment.',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'The proposed new date for the shift (YYYY-MM-DD).',
    example: '2025-12-11',
    required: false,
  })
  // At least one of these must be different from the original shift
  @IsOptional()
  @IsDateString()
  newDate?: string;

  @ApiProperty({
    description: 'The proposed new start time for the shift (HH:MM, 24-hour).',
    example: '10:00',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Time must be in HH:MM' })
  newStartTime?: string;

  @ApiProperty({
    description: 'The proposed new end time for the shift (HH:MM, 24-hour).',
    example: '18:00',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Time must be in HH:MM' })
  newEndTime?: string;

  // Note: In a more complex scenario, you might include proposed new times here.
  // For now, this is handled as a simple request for a change to be discussed.
}