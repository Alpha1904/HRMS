import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, MinLength } from 'class-validator';

export class ConductInterviewDto {
  @ApiProperty({ example: '2026-02-15T10:30:00.000Z' })
  @IsDateString()
  interviewDate: string;

  @ApiProperty({ example: 'Discussed reasons, feedback, handover.' })
  @IsString()
  @MinLength(1)
  notes: string;
}
