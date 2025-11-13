import { IsInt, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({
    description: 'The User ID of the message sender (typically from authenticated request)',
    example: 10,
    type: 'integer',
  })
  @IsInt()
  senderId: number;

  @ApiProperty({
    description: 'The User ID of the message recipient',
    example: 5,
    type: 'integer',
  })
  @IsInt()
  receiverId: number;

  @ApiProperty({
    description: 'The main content/body of the message',
    example: 'Hi, can you review the proposal I sent?',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'Optional subject line for the message',
    example: 'Proposal Review Needed',
    required: false,
  })
  @IsString()
  @IsOptional()
  subject?: string;
}