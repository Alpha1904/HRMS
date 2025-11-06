import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

// This DTO updates *only* the User model's fields.
// Profile updates will be handled by Profile CRUD.
export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  @ApiPropertyOptional({ description: "User's email address", example: 'jane.doe@example.com' })
  email?: string;

  @IsEnum(Role)
  @IsOptional()
  @ApiPropertyOptional({ enum: Role, description: "User's role (Protected)", example: 'EMPLOYEE' })
  role?: Role; // WARNING: Should be protected by RBAC

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Set whether the user account is active' })
  isActive?: boolean;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Tenant ID for multi-tenancy support' })
  tenantId?: string;
}