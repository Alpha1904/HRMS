import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const ALLOWED_TYPES = ['NOTE', 'EMAIL', 'INTERVIEW_INVITE', 'DOC_REQUEST'];

export class CreateInteractionDto {
  @ApiProperty({ enum: ALLOWED_TYPES })
  @IsString()
  @IsIn(ALLOWED_TYPES)
  type: string;

  @ApiProperty({ example: 'Candidate shows strong technical skills...' })
  @IsString()
  content: string;
}