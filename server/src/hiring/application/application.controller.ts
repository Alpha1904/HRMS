import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { FeedbackDto } from './dto/feedback.dto';
import { MovePositionDto } from './dto/move-position.dto';
import { CurrentUserInterface } from '../../common/interfaces/current-user.interface';
import { Role } from '@prisma/client';
import { SetMetadata } from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

const IS_PUBLIC_KEY = 'isPublic';
const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@ApiTags('applications')
@Controller('applications')
export class ApplicationController {
  constructor(private applicationService: ApplicationService) {}

  @Post()
  @Public()
  @UseInterceptors(FileInterceptor('resume'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Submit a job application (public for external, auth for internal)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        postingId: { type: 'number' },
        fullName: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        linkedinUrl: { type: 'string' },
        resume: { type: 'string', format: 'binary' },
      },
      required: ['postingId'],
    },
  })
  create(
    @Body() dto: CreateApplicationDto,
    @UploadedFile() resume: Express.Multer.File,
    @CurrentUser() currentUser?: CurrentUserInterface,
  ) {
    return this.applicationService.create(dto, resume, currentUser);
  }

  @Get('posting/:postingId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECRUITER, Role.HR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all applications for a job posting' })
  findAllByPosting(
    @Param('postingId', ParseIntPipe) postingId: number,
    @Query() filters: any,
    @CurrentUser() currentUser: CurrentUserInterface,
  ) {
    return this.applicationService.findAllByPosting(postingId, filters, currentUser);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECRUITER, Role.HR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get application by ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: CurrentUserInterface,
  ) {
    return this.applicationService.findOne(id, currentUser);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECRUITER, Role.HR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update application status' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() currentUser: CurrentUserInterface,
  ) {
    return this.applicationService.updateStatus(id, dto, currentUser);
  }

  @Patch(':id/position')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECRUITER, Role.HR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update application board position (for Kanban)' })
  movePosition(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MovePositionDto,
    @CurrentUser() currentUser: CurrentUserInterface,
  ) {
    return this.applicationService.movePosition(id, dto, currentUser);
  }

  @Patch(':id/feedback')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECRUITER, Role.HR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add feedback and score to application' })
  addFeedback(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: FeedbackDto,
    @CurrentUser() currentUser: CurrentUserInterface,
  ) {
    return this.applicationService.addFeedback(id, dto, currentUser);
  }
}