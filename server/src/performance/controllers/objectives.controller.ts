import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ObjectivesService } from '../services/objectives.service';
import { CreateObjectiveDto } from '../dto/create-objective.dto';
import { UpdateObjectiveDto } from '../dto/update-objective.dto';
import { LogProgressDto } from '../dto/log-progress.dto';
import { UpdateObjectiveStatusDto } from '../dto/update-objective-status.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUserInterface } from '../../common/interfaces/current-user.interface';

@ApiTags('performance-objectives')
@ApiBearerAuth()
@Controller('performance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ObjectivesController {
  constructor(private objectives: ObjectivesService) {}

  @Post('evaluations/:evaluationId/objectives')
  @Roles(Role.MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Create objective for an evaluation' })
  @ApiParam({ name: 'evaluationId', type: Number, example: 1 })
  create(
    @Param('evaluationId', ParseIntPipe) evaluationId: number,
    @Body() dto: CreateObjectiveDto,
    @Req() req: any,
    @CurrentUser() user: CurrentUserInterface,
  ) {
    return this.objectives.createObjective(
      evaluationId,
      dto,
      { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] },
      user as any,
    );
  }

  @Get('evaluations/:evaluationId/objectives')
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'List objectives for an evaluation' })
  @ApiParam({ name: 'evaluationId', type: Number, example: 1 })
  list(@Param('evaluationId', ParseIntPipe) evaluationId: number) {
    return this.objectives.getObjectives(evaluationId);
  }

  @Get('objectives/:id')
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Get objective by id with progress history' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.objectives.getObjectiveById(id);
  }

  @Patch('objectives/:id')
  @Roles(Role.MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Update objective details' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateObjectiveDto,
    @Req() req: any,
    @CurrentUser() user: CurrentUserInterface,
  ) {
    return this.objectives.updateObjective(
      id,
      dto,
      { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] },
      user as any,
    );
  }

  @Patch('objectives/:id/status')
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Update objective status' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateObjectiveStatusDto,
    @Req() req: any,
    @CurrentUser() user: CurrentUserInterface,
  ) {
    return this.objectives.updateObjectiveStatus(
      id,
      dto.status,
      { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] },
      user as any,
    );
  }

  @Delete('objectives/:id')
  @Roles(Role.MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Delete objective' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any, @CurrentUser() user: CurrentUserInterface) {
    return this.objectives.deleteObjective(id, { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] }, user as any);
  }

  @Post('objectives/:id/progress')
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Log progress for objective' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  logProgress(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LogProgressDto,
    @Req() req: any,
    @CurrentUser() user: CurrentUserInterface,
  ) {
    return this.objectives.logProgress(
      id,
      dto,
      { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] },
      user as any,
    );
  }

  @Get('objectives/:id/progress')
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Get progress history for objective' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  getProgress(@Param('id', ParseIntPipe) id: number) {
    return this.objectives.getProgress(id);
  }
}
