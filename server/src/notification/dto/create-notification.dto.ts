import { IsInt, IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * This DTO is for INTERNAL service-to-service use,
 * NOT for a public-facing API endpoint.
 */
export class CreateNotificationDto {
  @IsInt()
  @ApiProperty({
    description: 'The ID of the user who will receive the notification.',
    example: 1,
  })
  recipientId: number; // The User ID (not Profile ID)

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The content of the notification message.',
    example: 'Your leave request has been approved.',
  })
  message: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'An optional URL to which the notification should link when clicked.',
    example: '/leaves/my-requests/123',
    required: false,
  })
  linkUrl?: string;
}