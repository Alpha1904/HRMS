import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreatePerformanceEvaluationDto {
  @ApiProperty({ example: 10, description: 'Employee Profile ID' })
  @IsInt()
  employeeId: number;

  @ApiProperty({ example: 1, description: 'Evaluation cycle ID' })
  @IsInt()
  cycleId: number;

  @ApiPropertyOptional({ example: 'tenant_123', description: 'Tenant identifier (optional if derived from the authenticated user)' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
