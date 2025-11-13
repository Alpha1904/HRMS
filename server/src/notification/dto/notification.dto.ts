import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsBoolean, IsDate } from 'class-validator';

export class NotificationDto {
  @ApiProperty({ description: 'The unique identifier of the notification', example: 1 })
  @IsInt()
  id: number;

  @ApiProperty({ description: 'The ID of the user who receives the notification', example: 101 })
  @IsInt()
  recipientId: number;

  @ApiProperty({ description: 'The content of the notification message', example: 'Your leave request has been approved.' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'An optional URL for the notification link', example: '/leaves/my-requests/123', required: false })
  @IsString()
  linkUrl?: string;

  @ApiProperty({ description: 'Indicates if the notification has been read', example: false })
  @IsBoolean()
  isRead: boolean;

  @ApiProperty({ description: 'The date and time when the notification was created', example: '2025-10-26T10:00:00.000Z' })
  @IsDate()
  createdAt: Date;

  @ApiProperty({ description: 'The date and time when the notification was last updated', example: '2025-10-26T10:00:00.000Z' })
  @IsDate()
  updatedAt: Date;
}