import { ContractType, Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
  @ApiProperty({ description: 'The name of the user' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'The email of the user' })
  @IsString()
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: "Contact information is required" })
  contactInfo: string;

  @ApiProperty({ description: 'The password of the user' })
  @IsString()
  @IsNotEmpty( { message: "Password is required" })
  password: string;

  @ApiProperty({ description: 'The avatar of the user' })
  @IsString()
  @IsOptional()
  site: string;

  @ApiProperty({ description: 'The role of the user', enum: Role })
  @IsEnum(Role)
  role: Role;

    // Optional employee-specific fields
  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  seniority?: number;

  @IsOptional()
  @IsDateString()
  contractStart?: string;

  @IsOptional()
  @IsDateString()
  contractEnd?: string;

  @IsOptional()
  @IsEnum(ContractType)
  contractType?: ContractType;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  managerId?: number;

  // Optional HR Admin specific fields
  @IsOptional()
  @IsString({ each: true })
  sitesManaged?: string[];
}