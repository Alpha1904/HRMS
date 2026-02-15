import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ShiftChangeStatus } from '@prisma/client';

export class ActionShiftRequestDto {
  @ApiProperty({
    description: "The action to take on the request ('APPROVED' or 'REJECTED').",
    enum: [ShiftChangeStatus.APPROVED, ShiftChangeStatus.REJECTED],
    example: ShiftChangeStatus.APPROVED,
  })
  @IsEnum([ShiftChangeStatus.APPROVED, ShiftChangeStatus.REJECTED])
  status: "APPROVED" | "REJECTED";

  @ApiProperty({
    description: 'Optional feedback or comments from the manager.',
    example: 'Approved. Please make sure to coordinate with your team.',
    required: false,
  })
  @IsOptional()
  @IsString()
  managerFeedback?: string;
}