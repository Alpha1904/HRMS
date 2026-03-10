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
import { Role } from '@prisma/client';
import { EvaluationCriteriaService } from '../services/evaluation-criteria.service';
import { CreateEvaluationCriteriaDto } from '../dto/create-evaluation-criteria.dto';
import { UpdateEvaluationCriteriaDto } from '../dto/update-evaluation-criteria.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUserInterface } from '../../common/interfaces/current-user.interface';

@ApiTags('performance-criteria')
@ApiBearerAuth()
@Controller('performance/criteria')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvaluationCriteriaController {
  constructor(private criteria: EvaluationCriteriaService) {}

  @Post()
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Create evaluation criterion' })
  create(@Body() dto: CreateEvaluationCriteriaDto, @Req() req: any, @CurrentUser() user: CurrentUserInterface) {
    return this.criteria.createCriteria(dto, { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] }, user);
  }

  @Get()
  @ApiOperation({ summary: 'List evaluation criteria' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, example: true })
  @ApiQuery({ name: 'tenantId', required: false, type: String, example: 'tenant_123' })
  findAll(@Query('isActive') isActive?: string, @Query('tenantId') tenantId?: string) {
    const isActiveBool = isActive === undefined ? undefined : String(isActive).toLowerCase() === 'true';
    return this.criteria.getCriteria({ isActive: isActiveBool, tenantId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get criteria by id' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.criteria.getCriteriaById(id);
  }

  @Patch(':id')
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Update criteria' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEvaluationCriteriaDto, @Req() req: any, @CurrentUser() user: CurrentUserInterface) {
    return this.criteria.updateCriteria(id, dto, { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] }, user);
  }

  @Delete(':id')
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Delete criteria' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any, @CurrentUser() user: CurrentUserInterface) {
    return this.criteria.deleteCriteria(id, { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] }, user);
  }

  @Patch(':id/toggle-status')
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Toggle criteria active status' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  toggle(@Param('id', ParseIntPipe) id: number, @Req() req: any, @CurrentUser() user: CurrentUserInterface) {
    return this.criteria.toggleCriteriaStatus(id, { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] }, user);
  }
}
