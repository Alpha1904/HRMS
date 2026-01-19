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
import { ManualEvaluationsService } from '../services/manual-evaluations.service';
import { CreateManualEvaluationDto } from '../dto/create-manual-evaluation.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUserInterface } from '../../common/interfaces/current-user.interface';
import { EvaluationAccessGuard } from '../guards/evaluation-access.guard';

@ApiTags('performance-manual-reviews')
@ApiBearerAuth()
@Controller('performance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ManualEvaluationsController {
  constructor(private manual: ManualEvaluationsService) {}

  @Post('evaluations/:evaluationId/manual-review')
  @Roles(Role.MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard, EvaluationAccessGuard)
  @ApiOperation({ summary: 'Create manual review for evaluation' })
  @ApiParam({ name: 'evaluationId', type: Number, example: 1 })
  create(
    @Param('evaluationId', ParseIntPipe) evaluationId: number,
    @Body() dto: CreateManualEvaluationDto,
    @Req() req: any,
    @CurrentUser() user: CurrentUserInterface,
  ) {
    return this.manual.createManualEvaluation(
      evaluationId,
      dto,
      { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] },
      user as any,
    );
  }

  @Get('evaluations/:evaluationId/manual-review')
  @UseGuards(JwtAuthGuard, RolesGuard, EvaluationAccessGuard)
  @ApiOperation({ summary: 'Get manual review for evaluation' })
  @ApiParam({ name: 'evaluationId', type: Number, example: 1 })
  findOne(@Param('evaluationId', ParseIntPipe) evaluationId: number, @CurrentUser() user: CurrentUserInterface) {
    return this.manual.getManualEvaluation(evaluationId, user);
  }

  @Patch('manual-reviews/:id')
  @Roles(Role.MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Update manual review' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateManualEvaluationDto, @Req() req: any, @CurrentUser() user: CurrentUserInterface) {
    return this.manual.updateManualEvaluation(
      id,
      dto,
      { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] },
      user as any,
    );
  }

  @Delete('manual-reviews/:id')
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Delete manual review' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any, @CurrentUser() user: CurrentUserInterface) {
    return this.manual.deleteManualEvaluation(id, { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] }, user);
  }
}
