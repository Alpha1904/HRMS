import { ApiPropertyOptional } from '@nestjs/swagger';
import { DepartureStatus, DepartureType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryDeparturesDto {
  @ApiPropertyOptional({ enum: DepartureStatus })
  @IsOptional()
  @IsEnum(DepartureStatus)
  status?: DepartureStatus;

  @ApiPropertyOptional({ enum: DepartureType })
  @IsOptional()
  @IsEnum(DepartureType)
  type?: DepartureType;

  @ApiPropertyOptional({ description: 'Employee Profile ID', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  profileId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
