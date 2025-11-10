import { ApiProperty } from '@nestjs/swagger';
import { ContractType } from '@prisma/client';

/**
 * Represents the public-facing data for a user profile.
 */
export class ProfileDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier for the profile.',
  })
  id: number;

  @ApiProperty({
    example: 'John Doe',
    description: "The user's full name.",
  })
  fullName: string;

  @ApiProperty({
    required: false,
    nullable: true,
    example: '/uploads/avatars/avatar.png',
    description: "URL to the user's avatar image.",
  })
  avatarUrl?: string | null;

  @ApiProperty({
    example: 'Engineering',
    description: 'The department the user belongs to.',
  })
  department: string;

  @ApiProperty({
    example: 'Software Engineer',
    description: 'The job position or title of the user.',
  })
  position: string;

  @ApiProperty({
    example: 'New York',
    description: 'The primary work site or location of the user.',
  })
  site: string;

  @ApiProperty({
    enum: ContractType,
    example: ContractType.FULL_TIME,
    description: 'The type of employment contract.',
  })
  contractType: ContractType;
}