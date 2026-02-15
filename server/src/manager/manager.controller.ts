import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProfileService } from '../profile/profile.service';
import { UpdateTeamDto } from './dto/update-team.dto';
import { QueryAvailabilityDto } from './dto/query-availability.dto';

/**
 * Controller for managing manager-employee relationships.
 * Routes are based on the manager's *Profile ID*.
 */
// @UseGuards(...) // TODO: Protect this controller
@ApiTags('Manager')
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
    @ApiOperation({ summary: 'Get all profiles that are managers' })
    @ApiResponse({ status: 200, description: 'Returns a list of manager profiles.' })
    getAllManagers() {
      return this.profileService.getAllManagers();
    }

  /**
   * Get all employees (profiles) managed by this manager
   */
  @Get(':managerProfileId/team')
  @ApiOperation({ summary: "Get a manager's team" })
  @ApiResponse({ status: 200, description: 'Returns a list of employee profiles.' })
  @ApiResponse({ status: 404, description: 'Manager profile not found.' })
  getTeam(@Param('managerProfileId', ParseIntPipe) managerProfileId: number) {
    return this.profileService.getTeamByManagerId(managerProfileId);
  }

  /**
   * Add one or more employees to a manager's team
   */
  @Post(':managerProfileId/team')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Add employees to a manager's team" })
  @ApiResponse({ status: 200, description: 'Employees successfully added.' })
  @ApiResponse({ status: 400, description: 'Bad Request. Invalid employee IDs.' })
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
  @ApiOperation({ summary: "Remove employees from a manager's team" })
  @ApiResponse({ status: 200, description: 'Employees successfully removed.' })
  @ApiResponse({ status: 400, description: 'Bad Request. Invalid employee IDs.' })
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
  @ApiOperation({ summary: "Get team's approved leave schedule" })
  @ApiParam({ name: 'managerProfileId', description: "The manager's profile ID", type: Number })
  @ApiResponse({ status: 200, description: 'Returns a list of approved leave requests for the team.' })
  @ApiResponse({ status: 400, description: 'Bad Request. Invalid date range.' })
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