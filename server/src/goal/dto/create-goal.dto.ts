import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, IsNotEmpty, IsOptional, IsDateString, IsIn } from 'class-validator';
import { GoalStatus } from '@prisma/client';

export class CreateGoalDto {
  @ApiProperty({
    description: 'The title of the goal.',
    example: 'Learn advanced TypeScript',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'A detailed description of the goal and its purpose.',
    example: 'Complete a course on advanced TypeScript features like decorators and mapped types.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'The profile ID of the employee to whom the goal is assigned.',
    example: 10,
  })
  @IsInt()
  profileId: number;

  @ApiPropertyOptional({
    description: 'The target completion date for the goal.',
    example: '2025-12-31T23:59:59.000Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiPropertyOptional({
    description: 'The initial status of the goal.',
    enum: GoalStatus,
    default: GoalStatus.NOT_STARTED,
  })
  @IsOptional()
  @IsIn(Object.values(GoalStatus))
  status: GoalStatus = GoalStatus.NOT_STARTED;

  @ApiPropertyOptional({
    description: 'The ID of the evaluation in which this goal was created.',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  createdInEvaluationId?: number;
}