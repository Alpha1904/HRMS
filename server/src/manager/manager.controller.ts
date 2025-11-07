import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ProfileService } from '../profile/profile.service';
import { UpdateTeamDto } from './dto/update-team.dto';
import { QueryAvailabilityDto } from './dto/query-availability.dto';

/**
 * Controller for managing manager-employee relationships.
 * Routes are based on the manager's *Profile ID*.
 */
// @UseGuards(...) // TODO: Protect this controller
@Controller('manager')
export class ManagerController {
  constructor(
    // We inject the *existing* ProfileService
    private readonly profileService: ProfileService,
  ) {}

  
  /**
   * Get all manager
   */
    @Get()
    getAllManagers() {
      return this.profileService.getAllManagers();
    }

  /**
   * Get all employees (profiles) managed by this manager
   */
  @Get(':managerProfileId/team')
  getTeam(@Param('managerProfileId', ParseIntPipe) managerProfileId: number) {
    return this.profileService.getTeamByManagerId(managerProfileId);
  }

  /**
   * Add one or more employees to a manager's team
   */
  @Post(':managerProfileId/team')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  addTeamMembers(
    @Param('managerProfileId', ParseIntPipe) managerProfileId: number,
    @Body() updateTeamDto: UpdateTeamDto,
  ) {
    return this.profileService.addTeamMembers(
      managerProfileId,
      updateTeamDto.employeeProfileIds,
    );
  }

  /**
   * Remove one or more employees from a manager's team
   * (Sets their managerId to null)
   */
  @Delete(':managerProfileId/team')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  removeTeamMembers(
    @Param('managerProfileId', ParseIntPipe) managerProfileId: number,
    @Body() updateTeamDto: UpdateTeamDto,
  ) {
    return this.profileService.removeTeamMembers(
      managerProfileId,
      updateTeamDto.employeeProfileIds,
    );
  }


  /**
   * GET /manager/:managerProfileId/team-availability
   *
   * Gets all approved leave for a manager's team within a
   * specified date range.
   *
   * @example
   * GET /manager/2/team-availability?startDate=2025-11-01&endDate=2025-11-30
   */
  @Get(':managerProfileId/team-availability')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  getTeamAvailability(
    @Param('managerProfileId', ParseIntPipe) managerProfileId: number,
    @Query() query: QueryAvailabilityDto,
  ) {
    // Convert string dates from DTO to Date objects for the service
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    return this.profileService.getTeamAvailability(
      managerProfileId,
      startDate,
      endDate,
    );
  }
}