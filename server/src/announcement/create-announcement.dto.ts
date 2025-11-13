import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsArray,
  IsInt,
  MinLength,
  ArrayNotEmpty,
} from 'class-validator';

/**
 * Data Transfer Object for creating a new announcement.
 */
export class CreateAnnouncementDto {
  @ApiProperty({
    description: 'The title of the announcement.',
    example: 'Q4 Town Hall Meeting',
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  title: string;

  @ApiProperty({
    description: 'The main content/body of the announcement.',
    example: 'Join us for the quarterly town hall next Friday.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'The profile ID of the user posting the announcement (must be an HR Admin).',
    example: 1,
  })
  @IsInt()
  postedById: number;

  @ApiProperty({
    description: 'Whether the announcement should be sent to all users.',
    example: true,
  })
  @IsBoolean()
  isGlobal: boolean;
}