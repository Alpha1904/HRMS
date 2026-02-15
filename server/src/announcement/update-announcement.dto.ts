import { PartialType } from '@nestjs/swagger';
import { CreateAnnouncementDto } from './create-announcement.dto';

/**
 * Data Transfer Object for updating an existing announcement.
 * All fields are optional.
 */
export class UpdateAnnouncementDto extends PartialType(CreateAnnouncementDto) {}