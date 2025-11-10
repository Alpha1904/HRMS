import { ApiProperty } from '@nestjs/swagger';
import { ProfileDto } from './profile.dto';

/**
 * Represents a single announcement record returned by the API.
 */
export class AnnouncementDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier for the announcement.',
  })
  id: number;

  @ApiProperty({
    example: 'System Maintenance Alert',
    description: 'The title of the announcement.',
  })
  title: string;

  @ApiProperty({
    example: 'The system will be down for scheduled maintenance tonight.',
    description: 'The main content of the announcement.',
  })
  content: string;

  @ApiProperty({
    example: true,
    description:
      'Indicates if the announcement is global (for all users) or targeted.',
  })
  isGlobal: boolean;

  @ApiProperty({
    required: false,
    example: ['New York', 'London'],
    description:
      'An array of site names to target if the announcement is not global.',
  })
  targetSites?: string[];

  @ApiProperty({
    type: () => ProfileDto,
    description: 'The profile of the user who posted the announcement.',
  })
  postedBy: ProfileDto;

  @ApiProperty({
    description: 'The date and time the announcement was created.',
  })
  createdAt: Date;
}