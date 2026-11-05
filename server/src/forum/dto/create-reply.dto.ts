import { IsInt, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReplyDto {
  @ApiProperty({
    description: 'The Topic ID that this reply is responding to',
    example: 3,
    type: 'integer',
  })
  @IsInt()
  topicId: number;

  @ApiProperty({
    description: 'The Profile ID of the person replying',
    example: 7,
    type: 'integer',
  })
  @IsInt()
  authorId: number;

  @ApiProperty({
    description: 'The content/text of the reply',
    example: 'You can submit a leave request through the HR portal under the Leaves section.',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}