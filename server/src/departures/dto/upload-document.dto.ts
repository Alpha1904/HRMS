import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UploadDepartureDocumentDto {
  @ApiProperty({ example: 'Resignation Letter' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'resignation' })
  @IsOptional()
  @IsString()
  type?: string;
}
