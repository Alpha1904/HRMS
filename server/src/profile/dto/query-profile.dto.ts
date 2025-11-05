import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryProfileDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @Type(() => Number) // Transform query string '1' to number 1
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number) // Transform query string '10' to number 10
  @IsInt()
  @Min(1)
  limit?: number;
}