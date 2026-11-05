import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JobPostingService } from './job-posting.service';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { UpdateJobPostingDto } from './dto/update-job-posting.dto';
import { FilterJobPostingDto } from './dto/filter-job-posting.dto';
import { CurrentUserInterface } from '../../common/interfaces/current-user.interface';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@ApiTags('job-postings')
@Controller('job-postings')
export class JobPostingController {
  constructor(private jobPostingService: JobPostingService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECRUITER, Role.HR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new job posting (draft)' })
  create(
    @Body() dto: CreateJobPostingDto,
    @CurrentUser() currentUser: CurrentUserInterface,
  ) {
    return this.jobPostingService.create(dto, currentUser);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all job postings with filters' })
  findAll(
    @Query() filters: FilterJobPostingDto,
    @CurrentUser() currentUser: CurrentUserInterface,
  ) {
    return this.jobPostingService.findAll(filters, currentUser);
  }

  @Get('public')
  @ApiOperation({ summary: 'Get published job postings (public)' })
  findPublic(@Query() filters: FilterJobPostingDto) {
    return this.jobPostingService.findPublic(filters);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get job posting by ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: CurrentUserInterface,
  ) {
    return this.jobPostingService.findOne(id, currentUser);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECRUITER, Role.HR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update job posting' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJobPostingDto,
    @CurrentUser() currentUser: CurrentUserInterface,
  ) {
    return this.jobPostingService.update(id, dto, currentUser);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECRUITER, Role.HR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish job posting' })
  publish(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: CurrentUserInterface,
  ) {
    return this.jobPostingService.publish(id, currentUser);
  }

  @Patch(':id/pause')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECRUITER, Role.HR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pause job posting' })
  pause(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: CurrentUserInterface,
  ) {
    return this.jobPostingService.pause(id, currentUser);
  }

  @Patch(':id/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECRUITER, Role.HR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Close job posting' })
  close(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: CurrentUserInterface,
  ) {
    return this.jobPostingService.close(id, currentUser);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECRUITER, Role.HR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete job posting' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: CurrentUserInterface,
  ) {
    await this.jobPostingService.softDelete(id, currentUser);
    return { message: 'Job posting deleted successfully' };
  }
}