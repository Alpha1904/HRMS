import { IsInt, IsString, IsOptional, IsNotEmpty } from 'class-validator';

/**
 * This DTO is for INTERNAL service-to-service use,
 * NOT for a public-facing API endpoint.
 */
export class CreateNotificationDto {
  @IsInt()
  recipientId: number; // The User ID (not Profile ID)

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  linkUrl?: string;
}