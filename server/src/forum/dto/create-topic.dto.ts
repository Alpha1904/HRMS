import { IsInt, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTopicDto {
  @ApiProperty({
    description: 'The Forum/Category ID where this topic will be posted',
    example: 1,
    type: 'integer',
  })
  @IsInt()
  forumId: number;

  @ApiProperty({
    description: 'The Profile ID of the author/creator of this topic',
    example: 5,
    type: 'integer',
  })
  @IsInt()
  authorId: number;

  @ApiProperty({
    description: 'The title of the forum topic/thread',
    example: 'How to submit a leave request?',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'The main content/body of the initial topic post',
    example: 'I need to know the process for submitting a leave request through the system.',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}