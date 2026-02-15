import { IsString, IsEnum, IsNumber, Min, IsOptional, IsBoolean } from 'class-validator';
import { ContractType, LeaveType, Role } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeavePolicyDto {
  @IsString()
  @ApiProperty({ description: 'The unique name of the leave policy.', example: 'Standard Vacation Policy' })
  name: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'A brief description of the policy.', example: 'Standard vacation policy for full-time employees after 1 year.' })
  description?: string;

  @IsEnum(LeaveType)
  @ApiProperty({ enum: LeaveType, description: 'The type of leave this policy applies to.', example: LeaveType.VACATION })
  leaveType: LeaveType;

  @IsNumber()
  @Min(0)
  @ApiProperty({ description: 'The number of days allocated for this leave type per year.', example: 20 })
  daysAllocated: number;

  // --- Applicability Criteria (who does this apply to?) ---
  // All optional, allowing for broad or specific policies.

  @IsOptional()
  @IsEnum(ContractType)
  @ApiPropertyOptional({ enum: ContractType, description: 'Filter by contract type.', example: ContractType.FULL_TIME })
  contractType?: ContractType;

  @IsOptional()
  @IsEnum(Role)
  @ApiPropertyOptional({ enum: Role, description: 'Filter by user role.', example: Role.EMPLOYEE })
  role?: Role;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by department.', example: 'Engineering' })
  department?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by work site or location.', example: 'Main Office' })
  site?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ description: 'Minimum years of service to be eligible (inclusive).', example: 1 })
  minSeniority?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ description: 'Maximum years of service to be eligible (inclusive).', example: 5 })
  maxSeniority?: number;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Can unused days be carried over to the next year?', example: true })
  isCarryOverAllowed?: boolean;
  
  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'The maximum number of days that can be carried over.', example: 5 })
  maxCarryOverDays?: number;
}