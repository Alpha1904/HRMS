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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CandidateService } from './candidate.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { CurrentUserInterface } from '../../common/interfaces/current-user.interface';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@ApiTags('candidates')
@Controller('candidates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RECRUITER, Role.HR_ADMIN)
@ApiBearerAuth()
export class CandidateController {
  constructor(private candidateService: CandidateService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new candidate' })
  create(
    @Body() dto: CreateCandidateDto,
    @CurrentUser() currentUser: CurrentUserInterface,
  ) {
    return this.candidateService.create(dto, currentUser);
  }

  @Get()
  @ApiOperation({ summary: 'Get all candidates with filters' })
  findAll(
    @Query() filters: any,
    @CurrentUser() currentUser: CurrentUserInterface,
  ) {
    return this.candidateService.findAll(filters, currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get candidate by ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: CurrentUserInterface,
  ) {
    return this.candidateService.findOne(id, currentUser);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update candidate' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCandidateDto,
    @CurrentUser() currentUser: CurrentUserInterface,
  ) {
    return this.candidateService.update(id, dto, currentUser);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate candidate' })
  deactivate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: CurrentUserInterface,
  ) {
    return this.candidateService.deactivate(id, currentUser);
  }
}
