import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DepartureStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ChangeStatusDto {
  @ApiProperty({ enum: DepartureStatus, example: DepartureStatus.APPROVED })
  @IsEnum(DepartureStatus)
  status: DepartureStatus;

  @ApiPropertyOptional({ example: 'Approved by HR' })
  @IsOptional()
  @IsString()
  notes?: string;
}
