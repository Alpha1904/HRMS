import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessShiftChangeRequestDto {
  @ApiProperty({
    description: 'Action to take on the change request.',
    enum: ['APPROVED', 'REJECTED'],
    example: 'APPROVED',
  })
  @IsEnum(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';

  @ApiProperty({
    description: 'Manager feedback or reason for approval/rejection.',
    example: 'Approved. You can take this shift change.',
    required: false,
  })
  @IsOptional()
  @IsString()
  feedback?: string;
}
