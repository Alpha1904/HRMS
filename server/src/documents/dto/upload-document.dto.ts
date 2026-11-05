import { IsEnum, IsInt, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadDocumentDto {
  @ApiProperty({ enum: ['profile', 'candidate', 'application'] })
  @IsEnum(['profile', 'candidate', 'application'])
  entityType: 'profile' | 'candidate' | 'application';

  @ApiProperty()
  @IsString()
  entityId: string;

  @ApiProperty({ example: 'RESUME' })
  @IsString()
  type: string;
}