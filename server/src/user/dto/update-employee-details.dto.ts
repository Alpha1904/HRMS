import { IsOptional, IsString, IsNumber, IsDateString, IsEnum, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { ContractType } from '@prisma/client';

export class UpdateEmployeeDetailsDto {
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
  @ValidateIf(o => o.contractEnd !== null)
  @IsDateString()
  contractEnd?: Date;

  @IsOptional()
  @IsEnum(ContractType)
  contractType?: ContractType;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  managerId?: number;
}