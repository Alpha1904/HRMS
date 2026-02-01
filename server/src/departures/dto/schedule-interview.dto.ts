import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, Min } from 'class-validator';

export class ScheduleInterviewDto {
  @ApiProperty({ example: 12, description: 'Interviewer Profile ID' })
  @IsInt()
  @Min(1)
  interviewerId: number;

  @ApiProperty({ example: '2026-02-15T10:00:00.000Z' })
  @IsDateString()
  scheduledDate: string;
}
