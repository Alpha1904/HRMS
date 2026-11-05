import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InteractionService } from './interaction.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { CurrentUserInterface } from '../../common/interfaces/current-user.interface';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@ApiTags('interactions')
@Controller('applications/:applicationId/interactions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RECRUITER, Role.HR_ADMIN)
@ApiBearerAuth()
export class InteractionController {
  constructor(private interactionService: InteractionService) {}

  @Post()
  @ApiOperation({ summary: 'Create an interaction (note, email, interview invite, etc.)' })
  create(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Body() dto: CreateInteractionDto,
    @CurrentUser() currentUser: CurrentUserInterface,
  ) {
    return this.interactionService.create(dto, applicationId, currentUser);
  }

  @Get()
  @ApiOperation({ summary: 'Get all interactions for an application' })
  findByApplication(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @CurrentUser() currentUser: CurrentUserInterface,
  ) {
    return this.interactionService.findByApplication(applicationId, currentUser);
  }
}