import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class SubmitSurveyDto {
  @ApiProperty({ example: { q1: 'Great culture', q2: 4, q3: 'Improve onboarding' } })
  @IsNotEmpty()
  responses: any;
}
