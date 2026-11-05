import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator';

export class CreateHandoverDto {
  @ApiProperty({ example: 11, description: 'Assignee Profile ID' })
  @IsInt()
  @Min(1)
  assigneeId: number;

  @ApiPropertyOptional({ example: 'Transfer ownership of project X.' })
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: [{ task: 'Walkthrough module A', status: 'pending' }] })
  @IsOptional()
  tasks?: any;
}
