import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUserInterface } from '../../common/interfaces/current-user.interface';
import { DepartureAccessGuard } from '../guards/departure-access.guard';
import { CreateChecklistItemDto } from '../dto/create-checklist-item.dto';
import { UpdateChecklistItemDto } from '../dto/update-checklist-item.dto';
import { ChecklistsService } from '../services/checklists.service';

@ApiTags('departures-checklist')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChecklistsController {
  constructor(private readonly service: ChecklistsService) {}

  @Post('departures/:id/checklist')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartureAccessGuard)
  @Roles(Role.MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Add a checklist item to a departure' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  add(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateChecklistItemDto,
    @CurrentUser() user: CurrentUserInterface,
  ) {
    return this.service.addItem(id, dto, user);
  }

  @Get('departures/:id/checklist')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartureAccessGuard)
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'List checklist items for a departure' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  list(@Param('id', ParseIntPipe) id: number) {
    return this.service.list(id);
  }

  @Patch('checklist/:itemId')
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Update checklist item (assignee or HR)' })
  @ApiParam({ name: 'itemId', type: Number, example: 1 })
  update(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateChecklistItemDto,
    @CurrentUser() user: CurrentUserInterface,
  ) {
    return this.service.updateItem(itemId, dto, user);
  }

  @Delete('checklist/:itemId')
  @Roles(Role.MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Delete checklist item' })
  @ApiParam({ name: 'itemId', type: Number, example: 1 })
  remove(@Param('itemId', ParseIntPipe) itemId: number, @CurrentUser() user: CurrentUserInterface) {
    return this.service.removeItem(itemId, user);
  }
}
