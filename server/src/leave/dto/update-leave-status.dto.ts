import { IsEnum, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { LeaveStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLeaveStatusDto {
  @IsInt()
  @ApiProperty({ description: 'The profile ID of the manager actioning the request.', example: 2 })
  // In a real app, this would come from the authenticated manager's token (req.user.profileId)
  managerId: number; 

  @IsEnum(LeaveStatus)
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'], description: 'The new status for the leave request.', example: 'APPROVED' })
  status: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MinLength(5)
  @ApiPropertyOptional({ description: 'An optional reason for the status update.', example: 'Enjoy your time off!' })
  reason?: string;
}