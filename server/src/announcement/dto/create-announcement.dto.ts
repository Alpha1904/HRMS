import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsArray, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAnnouncementDto {
  @ApiProperty({
    description: 'The title of the announcement',
    example: 'System Maintenance Notice',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'The main content/body of the announcement',
    example: 'The system will undergo maintenance on Nov 15 from 2-4 AM EST.',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'If true, the announcement is visible to all employees. If false, only targeted groups see it.',
    example: false,
    default: false,
  })
  @IsBoolean()
  isGlobal: boolean = false;

  @ApiProperty({
    description: 'Array of site/department names to target. Only used if isGlobal is false. Leave empty or omit for no targeting.',
    example: ['New York Office', 'Engineering'],
    isArray: true,
    items: { type: 'string' },
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetSites?: string[]; 

  @ApiProperty({
    description: 'The Profile ID of the HR/Admin posting the announcement',
    example: 5,
    type: 'integer',
  })
  @IsInt()
  postedById: number; 
}