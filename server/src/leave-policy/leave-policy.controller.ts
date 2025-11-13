import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LeavePolicyService } from './leave-policy.service';
import { CreateLeavePolicyDto } from './dto/create-leave-policy.dto';
import { UpdateLeavePolicyDto } from './dto/update-leave-policy.dto';

// @UseGuards(RolesGuard) // ⚠️ SECURITY: Must be restricted to HR_ADMIN role
@ApiTags('leave-policies')
@Controller('leave-policies')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class LeavePolicyController {
  constructor(private readonly policyService: LeavePolicyService) {}

  /**
   * POST /leave-policies
   * Creates a new policy (HR Admin action)
   */
  @Post()
  @ApiOperation({ summary: 'Create a new leave policy' })
  @ApiResponse({ status: 201, description: 'The policy has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request. Invalid input data.' })
  create(@Body() dto: CreateLeavePolicyDto) {
    return this.policyService.create(dto);
  }

  /**
   * GET /leave-policies
   * Gets a list of all policies
   */
  @Get()
  @ApiOperation({ summary: 'Get all leave policies' })
  @ApiResponse({ status: 200, description: 'Returns a list of all leave policies.' })
  findAll() {
    return this.policyService.findAll();
  }

  /**
   * GET /leave-policies/:id
   * Gets a single policy
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a single leave policy by ID' })
  @ApiResponse({ status: 200, description: 'Returns the specified policy.' })
  @ApiResponse({ status: 404, description: 'Policy not found.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.policyService.findOne(id);
  }

  /**
   * PATCH /leave-policies/:id
   * Updates an existing policy
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing leave policy' })
  @ApiResponse({ status: 200, description: 'The policy has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Policy not found.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLeavePolicyDto,
  ) {
    return this.policyService.update(id, dto);
  }

  /**
   * DELETE /leave-policies/:id
   * Removes a policy
   */
  @Delete(':id')
  @HttpCode(204) // Standard response for successful deletion (No Content)
  @ApiOperation({ summary: 'Delete a leave policy' })
  @ApiResponse({ status: 204, description: 'The policy has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Policy not found.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.policyService.remove(id);
  }
}