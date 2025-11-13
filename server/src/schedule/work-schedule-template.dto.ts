import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class WorkScheduleTemplateDto {
  @ApiProperty({ description: 'The unique identifier of the template.', example: 1 })
  id: number;

  @ApiProperty({ description: 'A unique name for the work schedule template.', example: 'Standard Day (9-5)' })
  name: string;

  @ApiProperty({ description: 'An optional description for the template.', example: 'Monday to Friday, 9 AM to 5 PM', required: false })
  description?: string;

  @ApiProperty({ description: 'Optional site to which this template applies.', example: 'New York Office', required: false })
  site?: string;

  @ApiProperty({ description: 'Optional department to which this template applies.', example: 'Engineering', required: false })
  department?: string;

  @ApiProperty({ description: 'Optional role to which this template applies.', example: 'EMPLOYEE', enum: Role, required: false })
  role?: Role;

  @ApiProperty({ description: 'Indicates if this template is for a rotating schedule.', example: false })
  isRotation: boolean;

  @ApiProperty({ description: 'Number of days on for a rotating schedule.', example: 7, required: false })
  rotationDaysOn?: number;

  @ApiProperty({ description: 'Number of days off for a rotating schedule.', example: 3, required: false })
  rotationDaysOff?: number;

  @ApiProperty({ description: 'Default start time for shifts (HH:MM format).', example: '09:00', required: false })
  defaultStartTime?: string;

  @ApiProperty({ description: 'Default end time for shifts (HH:MM format).', example: '17:00', required: false })
  defaultEndTime?: string;

  @ApiProperty({ description: 'The date and time when the template was created.' })
  createdAt: Date;

  @ApiProperty({ description: 'The date and time when the template was last updated.' })
  updatedAt: Date;
}