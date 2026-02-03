import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, Min } from 'class-validator';

export class GeneratePayslipDto {
  @ApiProperty({ example: 10, description: 'Employee Profile ID' })
  @IsInt()
  @Min(1)
  profileId: number;

  @ApiProperty({ example: '2026-02-01T00:00:00.000Z', description: 'Target month (use first day of month)' })
  @IsDateString()
  month: string;
}
