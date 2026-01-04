import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PostingStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterJobPostingDto {
  @ApiPropertyOptional({ enum: PostingStatus })
  @IsEnum(PostingStatus)
  @IsOptional()
  status?: PostingStatus;

  @ApiPropertyOptional()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  site?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}