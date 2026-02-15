import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LeaveService } from './leave.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
// @UseGuards(JwtAuthGuard) // Protection would go here
@Controller('leaves')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  /**
   * Endpoint for an employee to submit a new leave request.
   * POST /leaves
   */
  @Post()
  @ApiOperation({ summary: 'Submit a new leave request' })
  @ApiResponse({ status: 201, description: 'The leave request has been successfully created.'})
  @ApiResponse({ status: 400, description: 'Bad Request. Invalid input data.'})
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createLeaveDto: CreateLeaveDto) {
    // In a real app, you would validate that the profileId in the DTO
    // matches the authenticated user's profileId.
    return this.leaveService.createRequest(createLeaveDto);
  }

  /**
   * Endpoint for an employee to view their current leave balances.
   * GET /leaves/balances/1
   */
  @Get('balances/:profileId')
  @ApiOperation({ summary: 'Get leave balances for a profile' })
  @ApiResponse({ status: 200, description: 'Returns an array of leave balances.'})
  getBalances(@Param('profileId', ParseIntPipe) profileId: number) {
    return this.leaveService.getBalancesByProfile(profileId);
  }

  /**
   * Endpoint for a Manager to approve or reject a leave request.
   * PATCH /leaves/:id/status
   */
  @Patch(':id/status')
  @ApiOperation({ summary: 'Approve or reject a leave request' })
  @ApiResponse({ status: 200, description: 'The leave request has been successfully updated.'})
  @ApiResponse({ status: 400, description: 'Bad Request. The request is already actioned or invalid.'})
  // NOTE: This endpoint MUST be protected by an AuthGuard that verifies the user's role is MANAGER.
  approveOrReject(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateLeaveStatusDto,
  ) {
    return this.leaveService.approveOrReject(id, updateDto);
  }
  
  // Add other GET /leaves/:id and GET /leaves methods here later.
}