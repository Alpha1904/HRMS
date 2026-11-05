import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class LogProgressDto {
  @ApiProperty({ example: 'Completed milestone 1 and prepared report', description: 'Progress update note' })
  @IsString()
  @IsNotEmpty()
  progressNote: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 100, example: 50, description: 'Optional numeric progress percentage (0..100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progressRate?: number;
}
