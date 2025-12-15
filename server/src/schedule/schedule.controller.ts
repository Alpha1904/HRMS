import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Delete,
  Param,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  Put,
  Patch,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { QueryShiftDto } from './dto/query-shift.dto';
import { CreateWorkScheduleTemplateDto } from './dto/create-template.dto';
import { UpdateWorkScheduleTemplateDto } from './dto/update-template.dto';
import { CreateShiftChangeRequestDto } from './dto/create-shift-change-request.dto';
import { ProcessShiftChangeRequestDto } from './dto/process-shift-change-request.dto';
import { ShiftDto } from './shift.dto';
import { WorkScheduleTemplateDto } from './work-schedule-template.dto';

@Controller('schedules')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  /**
   * ### Feature: Schedule Visualization
   * GET /shifts?startDate=...&endDate=...&managerId=...
   * Gets all shifts for a calendar view, filterable by date and team.
   */
  @Get()
  @ApiTags('Schedule')
  @ApiOperation({ summary: 'Get all shifts with optional filters' })
  @ApiQuery({ type: QueryShiftDto, description: 'Filter parameters for shifts' })
  @ApiResponse({ status: 200, description: 'Returns a list of shifts.', type: [ShiftDto] })
  findShifts(@Query() query: QueryShiftDto) {
    return this.scheduleService.findShifts(query);
  }

  /**
   * ### Feature: Create/Modify Schedules
   * POST /shifts
   * Assigns one or more employees to a new shift. (Manager action)
   */
  @Post()
  @ApiTags('Schedule')
  @ApiOperation({ summary: 'Create one or more shifts' })
  @ApiBody({ type: CreateShiftDto, description: 'Data for creating new shifts' })
  @ApiResponse({ status: 201, description: 'Shifts successfully created.', type: [ShiftDto] })
  @ApiResponse({ status: 400, description: 'Bad Request. e.g., overlapping shifts or invalid data.' })
  createShifts(@Body() dto: CreateShiftDto) {
    return this.scheduleService.createShifts(dto);
  }

  /**
   * ### Feature: Get Single Shift
   * GET /schedules/:id
   * Retrieves a specific shift with all its relations.
   */
  @Get(':id')
  @ApiTags('Schedule')
  @ApiOperation({ summary: 'Get a specific shift by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the shift to retrieve', type: Number })
  @ApiResponse({ status: 200, description: 'Returns the shift.', type: ShiftDto })
  @ApiResponse({ status: 404, description: 'Shift not found.' })
  findShiftById(@Param('id', ParseIntPipe) id: number) {
    return this.scheduleService.findShiftById(id);
  }

  /**
   * ### Feature: Update Shift
   * PUT /schedules/:id
   * Updates shift times, date, or template.
   */
  @Put(':id')
  @ApiTags('Schedule')
  @ApiOperation({ summary: 'Update an existing shift' })
  @ApiParam({ name: 'id', description: 'The ID of the shift to update', type: Number })
  @ApiBody({ type: UpdateShiftDto, description: 'Data for updating the shift' })
  @ApiResponse({ status: 200, description: 'Shift successfully updated.', type: ShiftDto })
  @ApiResponse({ status: 404, description: 'Shift not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request. e.g., invalid times or overlap detected.' })
  updateShift(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShiftDto,
  ) {
    return this.scheduleService.updateShift(id, dto);
  }

  /**
   * ### Feature: Delete Shift
   * DELETE /schedules/:id
   * Deletes a specific shift from the schedule.
   */
  @Delete(':id')
  @ApiTags('Schedule')
  @ApiOperation({ summary: 'Delete a specific shift' })
  @ApiParam({ name: 'id', description: 'The ID of the shift to delete', type: Number })
  @ApiResponse({ status: 200, description: 'Shift successfully deleted.', type: ShiftDto })
  @ApiResponse({ status: 404, description: 'Shift not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request. e.g., pending change requests.' })
  deleteShift(@Param('id', ParseIntPipe) id: number) {
    return this.scheduleService.deleteShift(id);
  }

  // ========================================
  // SHIFT CHANGE REQUESTS
  // ========================================

  /**
   * ### Feature: Request Shift Change
   * POST /schedules/:id/change-requests
   * Employee requests a modification to their shift.
   */
  @Post(':id/change-requests')
  @ApiTags('Shift Change Requests')
  @ApiOperation({ summary: 'Create a shift change request' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the shift to request changes for',
    type: Number,
  })
  @ApiBody({
    type: CreateShiftChangeRequestDto,
    description: 'Shift change request data',
  })
  @ApiResponse({
    status: 201,
    description: 'Change request successfully created.',
  })
  @ApiResponse({ status: 404, description: 'Shift not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only assigned employees can request changes.',
  })
  createShiftChangeRequest(
    @Param('id', ParseIntPipe) shiftId: number,
    @Body() dto: CreateShiftChangeRequestDto,
  ) {
    // In a real app, get requesterId from JWT/auth context
    // For now, we'll accept it from body or context
    const requesterId = 1; // TODO: Get from auth context
    return this.scheduleService.createShiftChangeRequest(
      shiftId,
      requesterId,
      dto,
    );
  }

  /**
   * ### Feature: Get Shift Change Requests
   * GET /schedules/:id/change-requests
   * Retrieves all change requests for a specific shift.
   */
  @Get(':id/change-requests')
  @ApiTags('Shift Change Requests')
  @ApiOperation({
    summary: 'Get all change requests for a specific shift',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the shift',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of change requests.',
  })
  @ApiResponse({ status: 404, description: 'Shift not found.' })
  getShiftChangeRequests(@Param('id', ParseIntPipe) shiftId: number) {
    return this.scheduleService.getShiftChangeRequests(shiftId);
  }

  /**
   * ### Feature: Process Change Request
   * PATCH /schedules/change-requests/:id
   * Manager approves or rejects a change request.
   */
  @Patch('change-requests/:id')
  @ApiTags('Shift Change Requests')
  @ApiOperation({
    summary: 'Approve or reject a shift change request',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the change request',
    type: Number,
  })
  @ApiBody({
    type: ProcessShiftChangeRequestDto,
    description: 'Action and feedback',
  })
  @ApiResponse({
    status: 200,
    description: 'Change request successfully processed.',
  })
  @ApiResponse({ status: 404, description: 'Change request not found.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. e.g., request already processed.',
  })
  processShiftChangeRequest(
    @Param('id', ParseIntPipe) requestId: number,
    @Body() dto: ProcessShiftChangeRequestDto,
  ) {
    // In a real app, get processedById from JWT/auth context
    const processedById = 1; // TODO: Get from auth context
    return this.scheduleService.processShiftChangeRequest(
      requestId,
      dto.status,
      dto.feedback,
      processedById,
    );
  }

  /**
   * ### Feature: Cancel Change Request
   * DELETE /schedules/change-requests/:id
   * Cancel a pending change request.
   */
  @Delete('change-requests/:id')
  @ApiTags('Shift Change Requests')
  @ApiOperation({ summary: 'Cancel a shift change request' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the change request to cancel',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Change request successfully cancelled.',
  })
  @ApiResponse({ status: 404, description: 'Change request not found.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. e.g., request already processed.',
  })
  cancelShiftChangeRequest(@Param('id', ParseIntPipe) requestId: number) {
    return this.scheduleService.cancelShiftChangeRequest(requestId);
  }

  // ========================================
  // ADDITIONAL SHIFT QUERIES
  // ========================================

  /**
   * ### Feature: Get Shifts by Profile
   * GET /schedules/profile/:profileId
   * Retrieves all shifts for a specific employee.
   */
  @Get('profile/:profileId')
  @ApiTags('Schedule Queries')
  @ApiOperation({
    summary: 'Get all shifts for a specific employee',
  })
  @ApiParam({
    name: 'profileId',
    description: 'The Profile ID of the employee',
    type: Number,
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date for filtering (YYYY-MM-DD)',
    required: false,
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date for filtering (YYYY-MM-DD)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of shifts for the employee.',
  })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  getShiftsByProfile(
    @Param('profileId', ParseIntPipe) profileId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.scheduleService.getShiftsByProfile(profileId, startDate, endDate);
  }

  /**
   * ### Feature: Get Shifts by Template
   * GET /schedules/template/:templateId
   * Retrieves all shifts generated from a specific template.
   */
  @Get('template/:templateId')
  @ApiTags('Schedule Queries')
  @ApiOperation({
    summary: 'Get all shifts for a specific template',
  })
  @ApiParam({
    name: 'templateId',
    description: 'The Template ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of shifts for the template.',
  })
  @ApiResponse({ status: 404, description: 'Template not found.' })
  getShiftsByTemplate(@Param('templateId', ParseIntPipe) templateId: number) {
    return this.scheduleService.getShiftsByTemplate(templateId);
  }

  // ========================================
  // WORK SCHEDULE TEMPLATE MANAGEMENT
  // ========================================

  @Post('templates')
  @ApiTags('Schedule')
  @ApiOperation({ summary: 'Create a new work schedule template' })
  @ApiBody({ type: CreateWorkScheduleTemplateDto, description: 'Data for creating a new template' })
  @ApiResponse({ status: 201, description: 'Template successfully created.', type: WorkScheduleTemplateDto })
  @ApiResponse({ status: 400, description: 'Bad Request. e.g., duplicate name or invalid data.' })
  createTemplate(@Body() dto: CreateWorkScheduleTemplateDto) {
    return this.scheduleService.createTemplate(dto);
  }

  @Get('templates')
  @ApiTags('Schedule')
  @ApiOperation({ summary: 'Get all work schedule templates' })
  @ApiResponse({ status: 200, description: 'Returns a list of work schedule templates.', type: [WorkScheduleTemplateDto] })
  findAllTemplates() {
    return this.scheduleService.findAllTemplates();
  }

  @Get('templates/:id')
  @ApiTags('Schedule')
  @ApiOperation({ summary: 'Get a work schedule template by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the template to retrieve', type: Number })
  @ApiResponse({ status: 200, description: 'Returns the work schedule template.', type: WorkScheduleTemplateDto })
  @ApiResponse({ status: 404, description: 'Template not found.' })
  findOneTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.scheduleService.findOneTemplate(id);
  }

  @Put('templates/:id')
  @ApiTags('Schedule')
  @ApiOperation({ summary: 'Update an existing work schedule template' })
  @ApiParam({ name: 'id', description: 'The ID of the template to update', type: Number })
  @ApiBody({ type: UpdateWorkScheduleTemplateDto, description: 'Data for updating the template' })
  @ApiResponse({ status: 200, description: 'Template successfully updated.', type: WorkScheduleTemplateDto })
  @ApiResponse({ status: 404, description: 'Template not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request. e.g., invalid data.' })
  updateTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkScheduleTemplateDto,
  ) {
    return this.scheduleService.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  @ApiTags('Schedule')
  @ApiOperation({ summary: 'Delete a work schedule template' })
  @ApiParam({ name: 'id', description: 'The ID of the template to delete', type: Number })
  @ApiResponse({ status: 200, description: 'Template successfully deleted.', type: WorkScheduleTemplateDto })
  @ApiResponse({ status: 404, description: 'Template not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request. e.g., template linked to existing shifts.' })
  deleteTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.scheduleService.deleteTemplate(id);
  }
}