import { PartialType } from '@nestjs/mapped-types';
import { ContractType } from '@prisma/client';
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
  fullName?: string;

  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @IsPhoneNumber() // Use a specific validator (e.g., 'E.164') if needed
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  site?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  position?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  hireDate?: Date;

  @IsInt()
  @IsOptional()
  managerId?: number;

  @IsEnum(ContractType)
  @IsOptional()
  contractType?: ContractType;

  // This allows for flexible, unstructured JSON data
  @IsObject()
  @IsOptional()
  roleData?: Record<string, any>;
  
  // Note: Termination fields (isTerminated, terminationDate)
  // are often handled by a separate "Offboarding" service, not a simple PATCH.
  // I am including them here for completeness but in a real system,
  // this would trigger a complex workflow (see your Departure model).
  
  @IsBoolean()
  @IsOptional()
  isTerminated?: boolean;
  
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  terminationDate?: Date;
}

// The UpdateProfileDto is a Partial of the base,
// meaning all fields are optional.
export class UpdateProfileDto extends PartialType(BaseProfileDto) {}