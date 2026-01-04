import { IsString, IsOptional, IsObject, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SalaryRangeDto {
  @ApiProperty()
  @IsOptional()
  min?: number;

  @ApiProperty()
  @IsOptional()
  max?: number;

  @ApiProperty()
  @IsOptional()
  currency?: string;
}

export class CreateJobPostingDto {
  @ApiProperty({ example: 'Senior Software Engineer' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'We are looking for...' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Engineering' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ example: 'New York Office' })
  @IsString()
  @IsOptional()
  site?: string;

  @ApiPropertyOptional({ type: SalaryRangeDto })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => SalaryRangeDto)
  salaryRange?: SalaryRangeDto;

  @ApiPropertyOptional({ example: '5+ years experience in...' })
  @IsString()
  @IsOptional()
  requirements?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}