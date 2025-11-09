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
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { CreateShiftDto } from './dto/create-shift.dto';
import { QueryShiftDto } from './dto/query-shift.dto';
import { CreateWorkScheduleTemplateDto } from './dto/create-template.dto';
import { UpdateWorkScheduleTemplateDto } from './dto/update-template.dto';
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
   * ### Feature: Modify Schedules
   * DELETE /shifts/:id
   * Deletes a specific shift from the schedule. (Manager action)
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
  // NEW Template Endpoints (Under /schedules/templates)
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