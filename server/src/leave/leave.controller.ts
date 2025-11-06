import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { LeaveService } from './leave.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';

// @UseGuards(JwtAuthGuard) // Protection would go here
@Controller('leaves')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  /**
   * Endpoint for an employee to submit a new leave request.
   * POST /leaves
   */
  @Post()
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
  getBalances(@Param('profileId', ParseIntPipe) profileId: number) {
    return this.leaveService.getBalancesByProfile(profileId);
  }

  /**
   * Endpoint for a Manager to approve or reject a leave request.
   * PATCH /leaves/:id/status
   */
  @Patch(':id/status')
  // NOTE: This endpoint MUST be protected by an AuthGuard that verifies the user's role is MANAGER.
  approveOrReject(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateLeaveStatusDto,
  ) {
    return this.leaveService.approveOrReject(id, updateDto);
  }
  
  // Add other GET /leaves/:id and GET /leaves methods here later.
}