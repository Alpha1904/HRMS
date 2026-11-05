import { Body, Controller, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUserInterface } from '../../common/interfaces/current-user.interface';
import { DepartureAccessGuard } from '../guards/departure-access.guard';
import { CreateHandoverDto } from '../dto/create-handover.dto';
import { HandoversService } from '../services/handovers.service';

@ApiTags('departures-handover')
@ApiBearerAuth()
@Controller('departures')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HandoversController {
  constructor(private readonly service: HandoversService) {}

  @Post(':id/handover')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartureAccessGuard)
  @Roles(Role.MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Create or update a handover plan' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  upsert(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateHandoverDto,
    @CurrentUser() user: CurrentUserInterface,
  ) {
    return this.service.upsertPlan(id, dto, user);
  }

  @Patch(':id/handover/complete')
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Mark handover plan as completed (assignee or HR)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  complete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserInterface,
  ) {
    return this.service.markCompleted(id, user);
  }
}
