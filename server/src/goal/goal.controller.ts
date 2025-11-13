import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { GoalService } from './goal.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { GoalStatus } from '@prisma/client';

@ApiTags('goals')
@Controller('goals')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  /**
   * POST /goals
   * Creates a new goal. (Usually done by a manager or during initial setup)
   */
  @ApiOperation({ summary: 'Create a new goal' })
  @ApiResponse({
    status: 201,
    description: 'The goal has been successfully created.',
  })
  @Post()
  create(@Body() createGoalDto: CreateGoalDto) {
    return this.goalService.create(createGoalDto);
  }

  /**
   * GET /goals?profileId=...&status=...
   * Retrieves all goals for a specific employee.
   */
  @ApiOperation({ summary: 'Find all goals for an employee' })
  @ApiQuery({
    name: 'profileId',
    required: true,
    type: Number,
    description: 'The profile ID of the employee.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: GoalStatus,
    description: 'Filter goals by their status.',
  })
  @ApiResponse({ status: 200, description: 'A list of employee goals.' })
  @Get()
  findEmployeeGoals(
    @Query('profileId', ParseIntPipe) profileId: number,
    @Query('status') status?: GoalStatus,
  ) {
    return this.goalService.findEmployeeGoals(profileId, status);
  }

  /**
   * GET /goals/:id
   * Retrieves a single goal.
   */
  @ApiOperation({ summary: 'Find a single goal by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the goal to retrieve.' })
  @ApiResponse({ status: 200, description: 'The requested goal.' })
  @ApiResponse({ status: 404, description: 'Goal not found.' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.goalService.findOne(id);
  }

  /**
   * PATCH /goals/:id
   * CORE FEATURE: Allows the owner or manager to update progress/status dynamically.
   */
  @ApiOperation({ summary: 'Update a goal' })
  @ApiParam({ name: 'id', description: 'The ID of the goal to update.' })
  @ApiQuery({
    name: 'updaterProfileId',
    required: true,
    type: Number,
    description: 'The profile ID of the user performing the update (owner or manager).',
  })
  @ApiResponse({ status: 200, description: 'The goal has been successfully updated.' })
  @ApiResponse({ status: 403, description: 'Forbidden. User cannot update this goal.' })
  @ApiResponse({ status: 404, description: 'Goal not found.' })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGoalDto: UpdateGoalDto,
    // NOTE: In a real app, this value would come from JWT/Auth context (req.user.profileId).
    // For testing simplicity, assume the current user has profile ID 10
    @Query('updaterProfileId', ParseIntPipe) updaterProfileId: number = 10,
  ) {
    return this.goalService.update(id, updateGoalDto, updaterProfileId);
  }

  /**
   * DELETE /goals/:id
   * Removes a goal.
   */
  @ApiOperation({ summary: 'Delete a goal' })
  @ApiParam({ name: 'id', description: 'The ID of the goal to delete.' })
  @ApiResponse({ status: 200, description: 'The goal has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Goal not found.' })
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.goalService.remove(id);
  }
}