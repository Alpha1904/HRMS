import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryProfileDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Search term to filter by name or email' })
  search?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter profiles by department' })
  department?: string;

  @IsOptional()
  @Type(() => Number) // Transform query string '1' to number 1
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ description: 'The page number for pagination', default: 1 })
  page?: number;

  @IsOptional()
  @Type(() => Number) // Transform query string '10' to number 10
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ description: 'The number of items per page', default: 10 })
  limit?: number;
}