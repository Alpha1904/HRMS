import { IsDateString, IsEnum, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { LeaveType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeaveDto {
  @IsInt()
  @ApiProperty({ description: 'The ID of the profile submitting the leave request.', example: 1 })
  // NOTE: In a real system protected by authentication (Guards), 
  // you would get the profileId from the request user object (req.user.profileId) 
  // and remove this field from the DTO. We keep it for direct testing.
  profileId: number; 

  @IsEnum(LeaveType)
  @ApiProperty({ enum: LeaveType, description: 'The type of leave being requested.', example: LeaveType.VACATION })
  type: LeaveType;

  @IsDateString()
  @ApiProperty({ description: 'The start date of the leave period.', example: '2025-12-20' })
  startDate: string;

  @IsDateString()
  @ApiProperty({ description: 'The end date of the leave period.', example: '2025-12-22' })
  endDate: string;
  
  // Optional reason for the request
  @IsOptional()
  @IsString()
  @MinLength(5)
  @ApiPropertyOptional({ description: 'An optional reason for the leave request.', example: 'Family vacation.' })
  reason?: string;
}