import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateEvaluationCriteriaDto {
  @ApiProperty({ example: 'attendance', description: 'Unique criteria name/key used in automatic scoring' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Measures attendance based on approved leave and policy', description: 'Optional criteria description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 0.3, minimum: 0, maximum: 1, description: 'Weight of this criteria in automatic scoring (0..1). Active weights should sum to 1.0' })
  @IsNumber()
  @Min(0)
  @Max(1)
  weight: number;

  @ApiPropertyOptional({ example: 'tenant_123', description: 'Tenant identifier (optional if derived from the authenticated user)' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
