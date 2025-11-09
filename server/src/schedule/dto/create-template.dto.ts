import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsInt,
  Min,
  ValidateIf,
  Matches,
} from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkScheduleTemplateDto {
  @ApiProperty({
    description: 'A unique name for the work schedule template.',
    example: 'Standard Day (9-5)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'An optional description for the template.',
    example: 'Monday to Friday, 9 AM to 5 PM',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  // Filter criteria
  @ApiProperty({
    description: 'Optional site to which this template applies.',
    example: 'New York Office',
    required: false,
  })
  @IsOptional()
  @IsString()
  site?: string;

  @ApiProperty({
    description: 'Optional department to which this template applies.',
    example: 'Engineering',
    required: false,
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({
    description: 'Optional role to which this template applies.',
    example: 'EMPLOYEE',
    enum: Role,
    required: false,
  })
  @IsOptional()
  @IsString()
  role?: Role; // Uses the Role enum from Prisma

  // Rotation settings
  @ApiProperty({
    description: 'Indicates if this template is for a rotating schedule.',
    example: false,
    default: false,
  })
  @IsBoolean()
  isRotation: boolean = false;

  @ApiProperty({
    description: 'Number of days on for a rotating schedule (required if isRotation is true).',
    example: 7,
    required: false,
  })
  @ValidateIf((o) => o.isRotation === true)
  @IsInt()
  @Min(1)
  rotationDaysOn?: number; // Must be present if rotation is true

  @ApiProperty({
    description: 'Number of days off for a rotating schedule (required if isRotation is true).',
    example: 3,
    required: false,
  })
  @ValidateIf((o) => o.isRotation === true)
  @IsInt()
  @Min(0)
  rotationDaysOff?: number; // Must be present if rotation is true

  // Standard hours for the template
  @ApiProperty({
    description: 'Default start time for shifts created from this template (HH:MM format).',
    example: '09:00',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Time must be in HH:MM format',
  })
  defaultStartTime?: string;

  @ApiProperty({
    description: 'Default end time for shifts created from this template (HH:MM format).',
    example: '17:00',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Time must be in HH:MM format',
  })
  defaultEndTime?: string;
}