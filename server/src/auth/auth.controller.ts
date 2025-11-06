import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginThrottlerGuard } from './guards/login-throttler.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 400, description: 'Bad Request. Invalid input data.' })
  @ApiResponse({ status: 409, description: 'Conflict. User with this email already exists.' })
  async register(
    @Body() data: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return await this.authService.register(data, res);
  }

  @UseGuards(LoginThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Log in a user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in. Tokens are set in HTTP-only cookies.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid credentials.' })
  @ApiResponse({ status: 429, description: 'Too many login attempts.' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return await this.authService.login(loginDto, res);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh the access token' })
  @ApiBody({ schema: { type: 'object', properties: { refreshToken: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Access token refreshed successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid refresh token.' })
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return await this.authService.refreshToken(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get the current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Returns the current user.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getProfile(@CurrentUser() user: any) {
    return await user;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send an OTP to the user\'s email for verification' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully.' })
  @ApiResponse({ status: 422, description: 'Email is already verified or could not send OTP.' })
  async sendOtp(@CurrentUser() user: any) {
    return await this.authService.sendOtp(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify the OTP for email verification' })
  @ApiBody({ schema: { type: 'object', properties: { otp: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Email verified successfully.' })
  @ApiResponse({ status: 422, description: 'Invalid or expired OTP.' })
  async verifyOtp(@CurrentUser() user: any, @Body('otp') otp: string) {
    return await this.authService.verifyOtp(user.id, otp);
  }

  @Post('forgot-pwd')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a password reset OTP to the user\'s email' })
  @ApiBody({ schema: { type: 'object', properties: { email: { type: 'string', format: 'email' } } } })
  @ApiResponse({ status: 200, description: 'OTP sent successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async sendResetOtp(@Body('email') email: string) {
    return await this.authService.sendResetOtp(email);
  }

  @Post('reset-pwd')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset the user\'s password using an OTP' })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @ApiResponse({ status: 422, description: 'Invalid or expired OTP.' })
  async resetPassword(
    @Body('email') email: string,
    @Body('otp') otp: string,
    @Body('newPassword') newPassword: string,
  ) {
    return await this.authService.resetPassword(email, otp, newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out the current user' })
  @ApiResponse({ status: 200, description: 'User successfully logged out.' })
  async logout(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.id, res);
  }
}
