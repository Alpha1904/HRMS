import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ description: 'The message content', example: 'Hello, are you available for a quick call?' })
  @IsNotEmpty()
  @IsString()
  content: string;
}