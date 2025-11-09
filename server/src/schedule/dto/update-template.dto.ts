import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkScheduleTemplateDto } from './create-template.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateWorkScheduleTemplateDto extends PartialType(
  CreateWorkScheduleTemplateDto,
) {}