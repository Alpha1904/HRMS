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
import { SelfEvaluationsService } from '../services/self-evaluations.service';
import { CreateSelfEvaluationDto } from '../dto/create-self-evaluation.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUserInterface } from '../../common/interfaces/current-user.interface';
import { EvaluationAccessGuard } from '../guards/evaluation-access.guard';

@ApiTags('performance-self-reviews')
@ApiBearerAuth()
@Controller('performance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SelfEvaluationsController {
  constructor(private self: SelfEvaluationsService) {}

  @Post('evaluations/:evaluationId/self-review')
  @Roles(Role.EMPLOYEE, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard, EvaluationAccessGuard)
  @ApiOperation({ summary: 'Create self review for evaluation' })
  @ApiParam({ name: 'evaluationId', type: Number, example: 1 })
  create(
    @Param('evaluationId', ParseIntPipe) evaluationId: number,
    @Body() dto: CreateSelfEvaluationDto,
    @Req() req: any,
    @CurrentUser() user: CurrentUserInterface,
  ) {
    return this.self.createSelfEvaluation(
      evaluationId,
      dto,
      { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] },
      user as any,
    );
  }

  @Get('evaluations/:evaluationId/self-review')
  @UseGuards(JwtAuthGuard, RolesGuard, EvaluationAccessGuard)
  @ApiOperation({ summary: 'Get self review for evaluation' })
  @ApiParam({ name: 'evaluationId', type: Number, example: 1 })
  findOne(@Param('evaluationId', ParseIntPipe) evaluationId: number, @CurrentUser() user: CurrentUserInterface) {
    return this.self.getSelfEvaluation(evaluationId, user);
  }

  @Patch('self-reviews/:id')
  @Roles(Role.EMPLOYEE, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Update self review' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateSelfEvaluationDto, @Req() req: any, @CurrentUser() user: CurrentUserInterface) {
    return this.self.updateSelfEvaluation(
      id,
      dto,
      { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] },
      user as any,
    );
  }

  @Delete('self-reviews/:id')
  @Roles(Role.EMPLOYEE, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Delete self review' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any, @CurrentUser() user: CurrentUserInterface) {
    return this.self.deleteSelfEvaluation(
      id,
      { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] },
      user as any,
    );
  }
}
