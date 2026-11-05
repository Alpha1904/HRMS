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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role, EvaluationPeriod } from '@prisma/client';
import { EvaluationCyclesService } from '../services/evaluation-cycles.service';
import { CreateEvaluationCycleDto } from '../dto/create-evaluation-cycle.dto';
import { UpdateEvaluationCycleDto } from '../dto/update-evaluation-cycle.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUserInterface } from '../../common/interfaces/current-user.interface';

@ApiTags('performance-cycles')
@ApiBearerAuth()
@Controller('performance/cycles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvaluationCyclesController {
  constructor(private cycles: EvaluationCyclesService) {}

  @Post()
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Create a new evaluation cycle' })
  create(@Body() dto: CreateEvaluationCycleDto, @Req() req: any, @CurrentUser() user: CurrentUserInterface) {
    return this.cycles.createCycle(dto, { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] }, user);
  }

  @Get()
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'List evaluation cycles (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'period', required: false, enum: EvaluationPeriod })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, example: true })
  findAll(
    @CurrentUser() user: CurrentUserInterface,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('period') period?: EvaluationPeriod,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBool = isActive === undefined ? undefined : String(isActive).toLowerCase() === 'true';
    return this.cycles.getCycles({ page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined, period, isActive: isActiveBool }, user);
  }

  @Get(':id')
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get cycle by id' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserInterface) {
    return this.cycles.getCycleById(id, user);
  }

  @Patch(':id')
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Update cycle' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEvaluationCycleDto, @Req() req: any, @CurrentUser() user: CurrentUserInterface) {
    return this.cycles.updateCycle(id, dto, { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] }, user);
  }

  @Delete(':id')
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Soft delete cycle (only if no evaluations)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any, @CurrentUser() user: CurrentUserInterface) {
    return this.cycles.deleteCycle(id, { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] }, user);
  }

  @Post(':id/activate')
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Activate cycle (deactivate other cycles of same period)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  activate(@Param('id', ParseIntPipe) id: number, @Req() req: any, @CurrentUser() user: CurrentUserInterface) {
    return this.cycles.activateCycle(id, { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] }, user);
  }

  @Post(':id/deactivate')
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Deactivate cycle' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  deactivate(@Param('id', ParseIntPipe) id: number, @Req() req: any, @CurrentUser() user: CurrentUserInterface) {
    return this.cycles.deactivateCycle(id, { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] }, user);
  }
}
