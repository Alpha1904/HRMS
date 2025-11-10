import { Controller, Get, Post, Body, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AnnouncementDto } from './announcement.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('announcements')
@Controller('announcements')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  /**
   * POST /announcements (Admin/HR only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HR_ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new announcement (HR Admin only)' })
  @ApiBearerAuth()
  @ApiBody({ type: CreateAnnouncementDto })
  @ApiResponse({
    status: 201,
    description: 'The announcement has been successfully created.',
    type: AnnouncementDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request. Invalid input data.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. User does not have the required role (HR_ADMIN).',
  })
  create(@Body() createAnnouncementDto: CreateAnnouncementDto) {
    return this.announcementService.create(createAnnouncementDto);
  }

  /**
   * Get announcements visible to a specific user.
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all announcements visible to the current user' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'A list of visible announcements.', type: [AnnouncementDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findVisible(@CurrentUser() user: { profileId: number }) {
    return this.announcementService.findVisible(user.profileId);
  }
}