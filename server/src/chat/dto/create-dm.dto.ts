import { IsNotEmpty, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDirectMessageDto {
  @ApiProperty({ description: 'Target user id (Profile id)', example: 123 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  targetUserId: number;
}