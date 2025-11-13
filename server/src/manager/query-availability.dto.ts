import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class QueryAvailabilityDto {
  @ApiProperty({
    description: 'The start date for the availability query (YYYY-MM-DD).',
    example: '2025-11-01',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: 'The end date for the availability query (YYYY-MM-DD).',
    example: '2025-11-30',
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}