import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateSelfEvaluationDto {
  @ApiProperty({ example: 'I achieved all goals and improved team collaboration', description: 'Employee self-review comments' })
  @IsString()
  @IsNotEmpty()
  comments: string;

  @ApiPropertyOptional({ example: 'Completed onboarding improvements and reduced bugs by 20%', description: 'Optional achievements (employee perspective)' })
  @IsOptional()
  @IsString()
  achievements?: string;

  @ApiPropertyOptional({ example: 'Balancing priorities during peak release cycles', description: 'Optional challenges faced (employee perspective)' })
  @IsOptional()
  @IsString()
  challenges?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 100, example: 90, description: 'Optional self score (0..100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  selfScore?: number;
}
