import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateChecklistItemDto {
  @ApiProperty({ example: 'Return company laptop' })
  @IsString()
  taskName: string;

  @ApiPropertyOptional({ example: 'Bring to IT desk before last day' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 42, description: 'Assignee User ID' })
  @IsOptional()
  @IsInt()
  @Min(1)
  assigneeId?: number;

  @ApiPropertyOptional({ example: '2026-02-25T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
