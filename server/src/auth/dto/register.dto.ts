import { Role, ContractType } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// A small, nested DTO for the profile data
class CreateUserProfileDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: "User's full name", example: 'John Doe' })
  fullName: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Department', example: 'Engineering' })
  department?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Job position', example: 'Software Developer' })
  position?: string;

  @IsEnum(ContractType)
  @IsOptional()
  @ApiPropertyOptional({ enum: ContractType, description: 'Type of employment contract', example: 'FULL_TIME' })
  contractType?: ContractType;
}

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ description: "User's email address", example: 'john.doe@example.com' })
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Password must be at least 3 characters long' })
  @ApiProperty({ description: "User's password (min 3 characters)", example: 'password123' })
  password: string;

  @IsEnum(Role)
  @IsNotEmpty()
  @ApiProperty({ enum: Role, description: "User's role", example: 'EMPLOYEE' })
  role: Role;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Tenant ID for multi-tenancy support', example: 'acme-corp' })
  tenantId?: string;
  
  // We validate the nested profile object
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateUserProfileDto)
  @ApiProperty({ type: CreateUserProfileDto, description: 'User profile information' })
  profile: CreateUserProfileDto;
}