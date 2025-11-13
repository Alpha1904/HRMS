import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ShiftRequestService } from './shift-request.service';
import { CreateShiftRequestDto } from './dto/create-shift-request.dto';
import { ActionShiftRequestDto } from './dto/action-shift-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { ShiftRequestDto } from './shift-request.dto';

@Controller('shift-requests')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ShiftRequestController {
  constructor(private readonly requestService: ShiftRequestService) {}

  /**
   * ### Feature: Employee Submits Request
   * POST /shift-requests
   */
  @ApiTags('ShiftRequest')
  @ApiOperation({ summary: 'Create a new shift change request' })
  @ApiBody({ type: CreateShiftRequestDto, description: 'Data for creating the shift change request.' })
  @ApiResponse({ status: 201, description: 'The request was successfully created.', type: ShiftRequestDto })
  @ApiResponse({ status: 400, description: 'Bad Request. e.g., invalid shift ID or requester ID.' })
  @ApiResponse({ status: 404, description: 'Shift not found.' })
  @Post()
  createRequest(@Body() dto: CreateShiftRequestDto) {
    // In a real app, dto.requesterId would be injected from req.user
    return this.requestService.createRequest(dto);
  }

  /**
   * ### Feature: Manager Views Pending Requests
   * GET /shift-requests/pending
   */
  @UseGuards(JwtAuthGuard)
  @ApiTags('ShiftRequest')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all pending shift change requests for the authenticated manager's team" })
  @ApiResponse({ status: 200, description: 'A list of pending shift change requests.', type: [ShiftRequestDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @Get('pending')
  getPendingRequests(@CurrentUser() user: { id: number }) {
    return this.requestService.getPendingRequests(user.id);
  }

  /**
   * ### Feature: Manager Actions Request
   * PATCH /shift-requests/:id/action
   */
  @UseGuards(JwtAuthGuard)
  @ApiTags('ShiftRequest')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve or reject a pending shift change request' })
  @ApiParam({ name: 'id', description: 'The ID of the shift change request to action.', type: Number })
  @ApiBody({ type: ActionShiftRequestDto, description: 'The action (approve/reject) and optional feedback.' })
  @ApiResponse({ status: 200, description: 'The request was successfully actioned.', type: ShiftRequestDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. User is not the manager for this request.' })
  @ApiResponse({ status: 404, description: 'Request not found.' })
  @Patch(':id/action')
  actionRequest(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
    @Body() dto: ActionShiftRequestDto,
  ) {
    return this.requestService.actionRequest(id, user.id, dto);
  }
}