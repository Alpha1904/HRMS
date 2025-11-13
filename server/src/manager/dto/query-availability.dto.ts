import { IsDateString, IsNotEmpty } from 'class-validator';

export class QueryAvailabilityDto {
  @IsDateString()
  @IsNotEmpty()
  startDate: string; // e.g., '2025-11-01T00:00:00Z'

  @IsDateString()
  @IsNotEmpty()
  endDate: string; // e.g., '2025-11-30T23:59:59Z'
}