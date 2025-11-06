import { IsDateString, IsEnum, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { LeaveType } from '@prisma/client';

export class CreateLeaveDto {
  @IsInt()
  // NOTE: In a real system protected by authentication (Guards), 
  // you would get the profileId from the request user object (req.user.profileId) 
  // and remove this field from the DTO. We keep it for direct testing.
  profileId: number; 

  @IsEnum(LeaveType)
  type: LeaveType;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
  
  // Optional reason for the request
  @IsOptional()
  @IsString()
  @MinLength(5)
  reason?: string;
}