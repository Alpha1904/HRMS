import { ApiProperty } from '@nestjs/swagger';

export class ShiftDto {
  @ApiProperty({ description: 'The unique identifier of the shift.', example: 1 })
  id: number;

  @ApiProperty({ description: 'The ID of the profile assigned to this shift.', example: 15 })
  profileId: number;

  @ApiProperty({ description: 'The specific date of the shift.', example: '2025-12-10T00:00:00.000Z', type: 'string', format: 'date' })
  date: Date;

  @ApiProperty({ description: 'The start time of the shift.', example: '2025-12-10T09:00:00.000Z', type: 'string', format: 'date-time' })
  startTime: Date;

  @ApiProperty({ description: 'The end time of the shift.', example: '2025-12-10T17:00:00.000Z', type: 'string', format: 'date-time' })
  endTime: Date;

  @ApiProperty({ description: 'The ID of the template this shift was generated from.', example: 1, required: false, nullable: true })
  templateId: number | null;

  @ApiProperty({ description: 'The date and time when the shift was created.' })
  createdAt: Date;

  @ApiProperty({ description: 'The date and time when the shift was last updated.' })
  updatedAt: Date;
}