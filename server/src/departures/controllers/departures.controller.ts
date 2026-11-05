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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUserInterface } from '../../common/interfaces/current-user.interface';
import { DepartureAccessGuard } from '../guards/departure-access.guard';
import { ChangeStatusDto } from '../dto/change-status.dto';
import { CreateDepartureDto } from '../dto/create-departure.dto';
import { QueryDeparturesDto } from '../dto/query-departures.dto';
import { UpdateDepartureDto } from '../dto/update-departure.dto';
import { UpdateSeveranceDto } from '../dto/update-severance.dto';
import { DeparturesService } from '../services/departures.service';

@ApiTags('departures')
@ApiBearerAuth()
@Controller('departures')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeparturesController {
  constructor(private readonly departures: DeparturesService) {}

  @Post()
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Create a departure request' })
  @ApiResponse({ status: 201, description: 'Departure created' })
  create(@Body() dto: CreateDepartureDto, @CurrentUser() user: CurrentUserInterface) {
    return this.departures.create(dto, user);
  }

  @Get()
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'List departures (paginated + filters)' })
  findAll(@Query() query: QueryDeparturesDto, @CurrentUser() user: CurrentUserInterface) {
    return this.departures.findAll(query, user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartureAccessGuard)
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Get departure detail (includes all relations)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserInterface) {
    return this.departures.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartureAccessGuard)
  @Roles(Role.MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Update departure fields' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartureDto,
    @CurrentUser() user: CurrentUserInterface,
  ) {
    return this.departures.update(id, dto, user);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartureAccessGuard)
  @Roles(Role.MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Change departure status' })
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: CurrentUserInterface,
  ) {
    return this.departures.changeStatus(id, dto, user);
  }

  @Patch(':id/severance')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartureAccessGuard)
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Update/approve severance' })
  updateSeverance(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSeveranceDto,
    @CurrentUser() user: CurrentUserInterface,
  ) {
    return this.departures.updateSeverance(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartureAccessGuard)
  @Roles(Role.MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Cancel/delete departure (only PENDING/CANCELLED)' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserInterface, @Req() req: any) {
    return this.departures.remove(id, user);
  }
}
