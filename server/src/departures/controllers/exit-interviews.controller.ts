import { Body, Controller, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUserInterface } from '../../common/interfaces/current-user.interface';
import { DepartureAccessGuard } from '../guards/departure-access.guard';
import { ConductInterviewDto } from '../dto/conduct-interview.dto';
import { ScheduleInterviewDto } from '../dto/schedule-interview.dto';
import { ExitInterviewsService } from '../services/exit-interviews.service';

@ApiTags('departures-exit-interviews')
@ApiBearerAuth()
@Controller('departures')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExitInterviewsController {
  constructor(private readonly service: ExitInterviewsService) {}

  @Post(':id/interview/schedule')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartureAccessGuard)
  @Roles(Role.MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Schedule exit interview for a departure' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  schedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ScheduleInterviewDto,
    @CurrentUser() user: CurrentUserInterface,
  ) {
    return this.service.schedule(id, dto, user);
  }

  @Patch(':id/interview/conduct')
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Conduct exit interview (interviewer only)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  conduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConductInterviewDto,
    @CurrentUser() user: CurrentUserInterface,
  ) {
    return this.service.conduct(id, dto, user);
  }
}
