import { PartialType } from '@nestjs/swagger';
import { ContractType } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUrl,
  IsPhoneNumber,
  IsInt,
  IsDate,
  IsObject,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

// We create a base DTO with all updatable fields
class BaseProfileDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: "The user's full name", example: 'Jane Doe' })
  fullName?: string;

  @IsUrl()
  @IsOptional()
  @ApiPropertyOptional({ description: 'URL for the user avatar', example: 'https://example.com/avatar.png' })
  avatarUrl?: string;

  @IsPhoneNumber() // Use a specific validator (e.g., 'E.164') if needed
  @IsOptional()
  @ApiPropertyOptional({ description: "The user's phone number", example: '+15551234567' })
  phone?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'The work site or office location', example: 'New York' })
  site?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'The department the user belongs to', example: 'Engineering' })
  department?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: "The user's job title or position", example: 'Senior Software Engineer' })
  position?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @ApiPropertyOptional({ description: 'The date the user was hired', example: '2022-08-15' })
  hireDate?: Date;

  @IsInt()
  @IsOptional()
  @ApiPropertyOptional({ description: "The profile ID of the user's manager", example: 2 })
  managerId?: number;

  @IsEnum(ContractType)
  @IsOptional()
  @ApiPropertyOptional({ enum: ContractType, description: 'The type of employment contract', example: 'FULL_TIME' })
  contractType?: ContractType;

  // This allows for flexible, unstructured JSON data
  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Role-specific data in JSON format', example: { project: 'Phoenix' } })
  roleData?: Record<string, any>;
  
  // Note: Termination fields (isTerminated, terminationDate)
  // are often handled by a separate "Offboarding" service, not a simple PATCH.
  // I am including them here for completeness but in a real system,
  // this would trigger a complex workflow (see your Departure model).
  
  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Flag indicating if the user is terminated' })
  isTerminated?: boolean;
  
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @ApiPropertyOptional({ description: 'The date of termination' })
  terminationDate?: Date;
}

// The UpdateProfileDto is a Partial of the base,
// meaning all fields are optional.
export class UpdateProfileDto extends PartialType(BaseProfileDto) {}