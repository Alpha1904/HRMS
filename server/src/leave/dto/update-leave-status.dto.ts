import { IsEnum, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { LeaveStatus } from '@prisma/client';

export class UpdateLeaveStatusDto {
  @IsInt()
  // In a real app, this would come from the authenticated manager's token (req.user.profileId)
  managerId: number; 

  @IsEnum(LeaveStatus)
  status: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MinLength(5)
  reason?: string;
}