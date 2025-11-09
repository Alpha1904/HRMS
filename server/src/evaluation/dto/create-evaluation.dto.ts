import {
  IsInt,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EvalPeriod, Prisma } from '@prisma/client';
import { CreateGoalDto } from '../../goal/dto/create-goal.dto'; // Import the Goal DTO
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class CreateEvaluationDto {
  @ApiProperty({
    description: 'The profile ID of the employee being reviewed.',
    example: 10,
  })
  @IsInt()
  profileId: number;

  @ApiPropertyOptional({
    description:
      'The profile ID of the manager or reviewer. Not required for self-evaluations.',
    example: 2,
  })
  @IsInt()
  @IsOptional()
  evaluatorId?: number;

  @ApiProperty({
    description: 'The evaluation period.',
    enum: EvalPeriod,
    example: EvalPeriod.QUARTERLY,
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(EvalPeriod))
  period: EvalPeriod;

  @ApiPropertyOptional({
    description: 'The overall score for the evaluation, typically on a 1-5 scale.',
    example: 4.5,
  })
  @IsOptional()
  @IsNumber()
  overallScore?: number;

  @ApiPropertyOptional({
    description: 'A summary of the employee’s key achievements during the period.',
    example: 'Successfully launched the new feature ahead of schedule.',
  })
  @IsOptional()
  @IsString()
  achievements?: string;

  @ApiPropertyOptional({
    description: 'Areas identified for improvement.',
    example: 'Could improve delegation of tasks to junior team members.',
  })
  @IsOptional()
  @IsString()
  improvements?: string;

  @ApiPropertyOptional({
    description: 'General feedback or comments from the evaluator.',
    example: 'Great performance this quarter. Keep up the excellent work!',
  })
  @IsOptional()
  @IsString()
  feedback?: string;

  @ApiPropertyOptional({
    description:
      'A JSON object containing scores for specific competencies.',
    example: { communication: 5, technicalSkills: 4, leadership: 4 },
  })
  @IsOptional()
  // Use Prisma.JsonObject for raw JSON/object
  scores?: Prisma.JsonObject; // Use Prisma.JsonObject for raw JSON/object

  // --- GOAL INTEGRATION ---
  @ApiPropertyOptional({
    description: 'An array of new goals to be set for the employee as part of this evaluation.',
    type: () => [CreateGoalDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGoalDto)
  newGoals?: CreateGoalDto[];
}

// For self-evaluation, we don't need the evaluatorId immediately.
export class CreateSelfEvaluationDto extends CreateEvaluationDto {
  @ApiProperty({
    description: 'Flag indicating this is a self-evaluation. Must be true.',
    example: true,
  })
  @IsBoolean()
  selfEval: boolean = true;
}