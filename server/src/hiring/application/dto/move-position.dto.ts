import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MovePositionDto {
  @ApiProperty({ example: 1.5 })
  @IsNumber()
  boardPosition: number;
}