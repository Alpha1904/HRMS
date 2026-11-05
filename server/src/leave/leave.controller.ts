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
  Delete,
} from '@nestjs/common';
import { LeaveService } from './leave.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
// @UseGuards(JwtAuthGuard) // Protection would go here
@Controller('leaves')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

// get all leaves
  @Get()
  @ApiOperation({ summary: 'Get all leave requests' })
  @ApiResponse({ status: 200, description: 'Returns an array of all leave requests.'})
  getAllLeaves() {
    return this.leaveService.getAllLeaves();
  }

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
   *   get leave by profile id
   */

  @Get(':id')
  @ApiOperation({ summary: 'Get leave request by profile ID' })
  @ApiResponse({ status: 200, description: 'Returns the leave request details.'})
  @ApiResponse({ status: 404, description: 'Leave request not found.'})
  getLeaveById(@Param('id', ParseIntPipe) id: number) {
    return this.leaveService.getLeaveById(id);
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

   // getall leaves by manager id
  @Get('manager/:managerId')
  @ApiOperation({ summary: 'Get all leave requests for employees under a manager' })
  @ApiResponse({ status: 200, description: 'Returns an array of leave requests.'})
  getLeavesByManagerId(@Param('managerId', ParseIntPipe) managerId: number) {
    return this.leaveService.getLeavesByManagerId(managerId);
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

  // delete many leaves by profile id
  @Delete(':profileId')
  @ApiOperation({ summary: 'Delete leave requests by profile ID' })
  @ApiResponse({ status: 200, description: 'The leave requests have been successfully deleted.'})
  @ApiResponse({ status: 404, description: 'No leave requests found for the given profile ID.'})
  deleteLeavesByProfileId(@Param('profileId', ParseIntPipe) profileId: number) {
    return this.leaveService.deleteLeavesByProfileId(profileId);
  }
  
  // Add other GET /leaves/:id and GET /leaves methods here later.
}