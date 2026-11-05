import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  ParseIntPipe,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUserInterface } from '../common/interfaces/current-user.interface';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { CreateCompensationDto } from './dto/create-compensation.dto';
import { GeneratePayslipDto } from './dto/generate-payslip.dto';
import { UpdateAdjustmentDto } from './dto/update-adjustment.dto';
import { UpdateCompensationDto } from './dto/update-compensation.dto';
import { AdjustmentService } from './services/adjustment.service';
import { CompensationService } from './services/compensation.service';
import { PayslipService } from './services/payslip.service';

@ApiTags('payment')
@ApiBearerAuth()
@Controller('payment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentController {
  constructor(
    private readonly compensation: CompensationService,
    private readonly adjustments: AdjustmentService,
    private readonly payslips: PayslipService,
  ) {}

  private auditContext(user: CurrentUserInterface, req: any) {
    return {
      performedById: user.id,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    };
  }

  @Post('compensation')
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Admin enters/updates salary/bonus info for an employee' })
  @ApiBody({ type: CreateCompensationDto })
  @ApiResponse({ status: 201, description: 'Compensation component created' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  createCompensation(
    @Body() dto: CreateCompensationDto,
    @CurrentUser() user: CurrentUserInterface,
    @Req() req: any,
  ) {
    return this.compensation.create(dto, this.auditContext(user, req));
  }

  @Get('compensation/:profileId')
  @Roles(Role.EMPLOYEE, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Get all compensation components for a profile (admin) or self (employee)' })
  @ApiParam({ name: 'profileId', type: Number })
  @ApiResponse({ status: 200, description: 'Compensation components list' })
  getCompensationByProfile(
    @Param('profileId', ParseIntPipe) profileId: number,
    @CurrentUser() user: CurrentUserInterface,
  ) {
    return this.compensation.findByProfile(profileId, user);
  }

  @Patch('compensation/:id')
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Update a compensation component (admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateCompensationDto })
  @ApiResponse({ status: 200, description: 'Compensation component updated' })
  updateCompensation(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompensationDto,
    @CurrentUser() user: CurrentUserInterface,
    @Req() req: any,
  ) {
    return this.compensation.update(id, dto, this.auditContext(user, req));
  }

  @Delete('compensation/:id')
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Soft-delete (deactivate) a compensation component (admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Compensation component deleted' })
  deleteCompensation(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserInterface,
    @Req() req: any,
  ) {
    return this.compensation.softDelete(id, this.auditContext(user, req));
  }

  @Post('adjustment')
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Admin applies salary change (e.g., increase, bonus)' })
  @ApiBody({ type: CreateAdjustmentDto })
  @ApiResponse({ status: 201, description: 'Salary adjustment created' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  createAdjustment(
    @Body() dto: CreateAdjustmentDto,
    @CurrentUser() user: CurrentUserInterface,
    @Req() req: any,
  ) {
    return this.adjustments.create(dto, this.auditContext(user, req));
  }

  @Get('adjustment/:profileId')
  @Roles(Role.EMPLOYEE, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Get adjustment history for a profile (admin) or self' })
  @ApiParam({ name: 'profileId', type: Number })
  @ApiResponse({ status: 200, description: 'Salary adjustment list' })
  getAdjustmentsByProfile(
    @Param('profileId', ParseIntPipe) profileId: number,
    @CurrentUser() user: CurrentUserInterface,
  ) {
    return this.adjustments.findByProfile(profileId, user);
  }

  @Patch('adjustment/:id')
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Update a salary adjustment (admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateAdjustmentDto })
  @ApiResponse({ status: 200, description: 'Salary adjustment updated' })
  updateAdjustment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdjustmentDto,
    @CurrentUser() user: CurrentUserInterface,
    @Req() req: any,
  ) {
    return this.adjustments.update(id, dto, this.auditContext(user, req));
  }

  @Post('payslip/generate')
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Admin triggers payslip generation for a specific employee and month (manual)' })
  @ApiBody({ type: GeneratePayslipDto })
  @ApiResponse({ status: 201, description: 'Payslip created' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  generatePayslip(
    @Body() dto: GeneratePayslipDto,
    @CurrentUser() user: CurrentUserInterface,
    @Req() req: any,
  ) {
    return this.payslips.generate(dto, this.auditContext(user, req));
  }

  @Get('payslip/:profileId/:month')
  @Roles(Role.EMPLOYEE, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Get payslip metadata (admin) or self' })
  @ApiParam({ name: 'profileId', type: Number })
  @ApiParam({ name: 'month', type: String, example: '2026-02-01' })
  @ApiResponse({ status: 200, description: 'Payslip metadata' })
  getPayslip(
    @Param('profileId', ParseIntPipe) profileId: number,
    @Param('month') month: string,
    @CurrentUser() user: CurrentUserInterface,
  ) {
    return this.payslips.getPayslip(profileId, month, user);
  }

  @Get('payslip/download/:profileId/:month')
  @Roles(Role.EMPLOYEE, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Download payslip PDF' })
  @ApiParam({ name: 'profileId', type: Number })
  @ApiParam({ name: 'month', type: String, example: '2026-02-01' })
  @ApiResponse({ status: 200, description: 'PDF file stream' })
  downloadPayslip(
    @Param('profileId', ParseIntPipe) profileId: number,
    @Param('month') month: string,
    @CurrentUser() user: CurrentUserInterface,
    @Res({ passthrough: true }) res: Response,
  ) {
    const parsed = new Date(month);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid month date. Use ISO date like 2026-02-01');
    }

    return this.payslips.downloadPayslip(profileId, parsed, user, res);
  }
}
