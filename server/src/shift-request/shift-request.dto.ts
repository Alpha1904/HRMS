import { ApiProperty } from '@nestjs/swagger';
import { ShiftChangeStatus } from '@prisma/client';

export class ShiftRequestDto {
  @ApiProperty({ description: 'The unique identifier of the shift change request.', example: 1 })
  id: number;

  @ApiProperty({ description: 'The ID of the shift being requested for change.', example: 101 })
  shiftId: number;

  @ApiProperty({ description: 'The ID of the employee profile who made the request.', example: 15 })
  requesterId: number;

  @ApiProperty({ description: 'The reason provided for the shift change request.', example: 'Family emergency', required: false, nullable: true })
  reason: string | null;

  @ApiProperty({ description: 'The current status of the request.', enum: ShiftChangeStatus, example: ShiftChangeStatus.PENDING })
  status: ShiftChangeStatus;

  @ApiProperty({ description: 'The proposed new date for the shift.', example: '2025-12-11T00:00:00.000Z', required: false, nullable: true })
  newDate: Date | null;

  @ApiProperty({ description: 'The proposed new start time for the shift.', example: '2025-12-11T10:00:00.000Z', required: false, nullable: true })
  newStartTime: Date | null;

  @ApiProperty({ description: 'The proposed new end time for the shift.', example: '2025-12-11T18:00:00.000Z', required: false, nullable: true })
  newEndTime: Date | null;

  @ApiProperty({ description: 'Feedback provided by the manager who actioned the request.', example: 'Approved', required: false, nullable: true })
  managerFeedback: string | null;

  @ApiProperty({ description: 'The date and time when the request was created.' })
  createdAt: Date;

  @ApiProperty({ description: 'The date and time when the request was last updated.' })
  updatedAt: Date;
}