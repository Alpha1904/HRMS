import { PartialType } from '@nestjs/swagger';
import { CreateGoalDto } from './create-goal.dto';
import { IsInt, Min, Max, IsOptional, IsIn } from 'class-validator';
import { GoalStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateGoalDto extends PartialType(CreateGoalDto) {
  @ApiPropertyOptional({
    description: 'The progress of the goal, from 0 to 100.',
    example: 50,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;

  @ApiPropertyOptional({
    description: 'The current status of the goal.',
    enum: GoalStatus,
  })
  @IsOptional()
  @IsIn(Object.values(GoalStatus))
  status?: GoalStatus;
}