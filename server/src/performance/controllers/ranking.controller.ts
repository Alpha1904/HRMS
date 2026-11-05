import { Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RankingService } from '../services/ranking.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUserInterface } from '../../common/interfaces/current-user.interface';

@ApiTags('performance-rankings')
@ApiBearerAuth()
@Controller('performance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RankingController {
  constructor(private ranking: RankingService) {}

  @Post('cycles/:cycleId/calculate-rankings')
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Calculate ranks for completed evaluations in a cycle' })
  @ApiParam({ name: 'cycleId', type: Number, example: 1 })
  calculate(@Param('cycleId', ParseIntPipe) cycleId: number, @Req() req: any, @CurrentUser() user: CurrentUserInterface) {
    return this.ranking.rankEmployeesByCycle(cycleId, { performedById: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] }, user);
  }

  @Get('cycles/:cycleId/rankings')
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get rankings (paginated)' })
  @ApiParam({ name: 'cycleId', type: Number, example: 1 })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'department', required: false, type: String, example: 'Engineering' })
  list(
    @Param('cycleId', ParseIntPipe) cycleId: number,
    @CurrentUser() user: CurrentUserInterface,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('department') department?: string,
  ) {
    return this.ranking.getRankings(
      cycleId,
      { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined, department },
      user,
    );
  }

  @Get('employees/:employeeId/cycles/:cycleId/rank')
  @Roles(Role.EMPLOYEE, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Get employee rank and percentile' })
  @ApiParam({ name: 'employeeId', type: Number, example: 10 })
  @ApiParam({ name: 'cycleId', type: Number, example: 1 })
  getEmployeeRank(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Param('cycleId', ParseIntPipe) cycleId: number,
    @CurrentUser() user: CurrentUserInterface,
  ) {
    return this.ranking.getEmployeeRank(employeeId, cycleId, user);
  }
}
