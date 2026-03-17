import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PerformanceEvaluationsService } from '../services/performance-evaluations.service';
import { CreatePerformanceEvaluationDto } from '../dto/create-performance-evaluation.dto';
import { QueryEvaluationDto } from '../dto/query-evaluation.dto';
import { UpdateEvaluationStatusDto } from '../dto/update-evaluation-status.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUserInterface } from '../../common/interfaces/current-user.interface';
import { AutomaticScoringService } from '../services/automatic-scoring.service';
import { EvaluationAccessGuard } from '../guards/evaluation-access.guard';

@ApiTags('performance-evaluations')
@ApiBearerAuth()
@Controller('performance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PerformanceEvaluationsController {
  constructor(
    private evaluations: PerformanceEvaluationsService,
    private automatic: AutomaticScoringService,
  ) {}

  @Post('evaluations')
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Create evaluation for employee in cycle' })
  create(@Body() dto: CreatePerformanceEvaluationDto, @Req() req: any, @CurrentUser() user: CurrentUserInterface) {
    return this.evaluations.createEvaluation(dto, { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] }, user);
  }

  @Post('cycles/:cycleId/initialize-evaluations')
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Initialize evaluations for all active employees in cycle' })
  @ApiParam({ name: 'cycleId', type: Number, example: 1 })
  initialize(@Param('cycleId', ParseIntPipe) cycleId: number, @Req() req: any, @CurrentUser() user: CurrentUserInterface) {
    return this.evaluations.initializeEvaluationsForCycle(cycleId, { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] }, user);
  }

  @Get('evaluations')
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN, Role.MANAGER, Role.EMPLOYEE)
  @ApiOperation({ summary: 'List evaluations (paginated + filters)' })
  findAll(@Query() query: QueryEvaluationDto, @CurrentUser() user: CurrentUserInterface) {
    return this.evaluations.getEvaluations(query, user as any);
  }

  @Get('evaluations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, EvaluationAccessGuard)
  @ApiOperation({ summary: 'Get evaluation details by id' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserInterface) {
    return this.evaluations.getEvaluationById(id, user);
  }

  @Get('employees/:employeeId/cycles/:cycleId/evaluation')
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN, Role.MANAGER, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Get evaluation for employee + cycle' })
  @ApiParam({ name: 'employeeId', type: Number, example: 10 })
  @ApiParam({ name: 'cycleId', type: Number, example: 1 })
  getEmployeeEval(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Param('cycleId', ParseIntPipe) cycleId: number,
    @CurrentUser() user: CurrentUserInterface,
  ) {
    return this.evaluations.getEmployeeEvaluation(employeeId, cycleId, user);
  }

  @Patch('evaluations/:id/status')
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Update evaluation status' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEvaluationStatusDto, @Req() req: any, @CurrentUser() user: CurrentUserInterface) {
    return this.evaluations.updateEvaluationStatus(id, dto.status, { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] }, user);
  }

  @Post('evaluations/:id/calculate-final-score')
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Calculate final score' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  calculateFinal(@Param('id', ParseIntPipe) id: number, @Req() req: any, @CurrentUser() user: CurrentUserInterface) {
    return this.evaluations.calculateFinalScore(id, { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] }, user);
  }

  @Delete('evaluations/:id')
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Delete evaluation' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any, @CurrentUser() user: CurrentUserInterface) {
    return this.evaluations.deleteEvaluation(id, { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] }, user);
  }

  @Post('evaluations/:id/calculate-automatic')
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Calculate automatic score for evaluation' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  calculateAutomatic(@Param('id', ParseIntPipe) id: number, @Req() req: any, @CurrentUser() user: CurrentUserInterface) {
    return this.automatic.calculateAutomaticScore(id, { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] }, user);
  }

  @Post('cycles/:cycleId/calculate-all-automatic')
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Calculate automatic scores for all evaluations in a cycle' })
  @ApiParam({ name: 'cycleId', type: Number, example: 1 })
  calculateAllAutomatic(@Param('cycleId', ParseIntPipe) cycleId: number, @Req() req: any, @CurrentUser() user: CurrentUserInterface) {
    return this.automatic.recalculateAllScores(cycleId, { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] }, user);
  }

  @Get('evaluations/:id/score-breakdown')
  @UseGuards(JwtAuthGuard, RolesGuard, EvaluationAccessGuard)
  @ApiOperation({ summary: 'Get automatic scoring breakdown' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  getBreakdown(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserInterface) {
    return this.automatic.getScoreBreakdown(id, user);
  }

  @Get('evaluations/:id/criteria-breakdown')
  @UseGuards(JwtAuthGuard, RolesGuard, EvaluationAccessGuard)
  @ApiOperation({ summary: 'Get criteria breakdown (attendance, discipline, task)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  getCriteriaBreakdown(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserInterface) {
    return this.automatic.getCriteriaBreakdown(id, user);
  }
}
