import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class UpdateSeveranceDto {
  @ApiProperty({ example: 1500 })
  @IsNumber()
  severancePay: number;

  @ApiPropertyOptional({ example: { base: 1000, bonus: 500, total: 1500 } })
  @IsOptional()
  severanceBreakdown?: any;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  severanceApproved?: boolean;
}
