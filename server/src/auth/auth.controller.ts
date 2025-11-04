import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginThrottlerGuard } from './guards/login-throttler.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Response } from 'express';
import { RegisterDto } from './dto/register.dto';

  
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body() data: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return await this.authService.register(data, res);
  }

  @UseGuards(LoginThrottlerGuard)
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return await this.authService.login(loginDto, res);
  }

    @Post('refresh')
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return await this.authService.refreshToken(refreshToken);
  }

   @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@CurrentUser() user: any) {
    return await user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('otp')
  async sendOtp(@CurrentUser() user: any) {
    return await this.authService.sendOtp(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-otp')
  async verifyOtp(@CurrentUser() user: any, @Body('otp') otp: string) {
    return await this.authService.verifyOtp(user.id, otp);
  }

  @Post('forgot-pwd')
  async sendResetOtp(@Body('email') email: string) {
    return await this.authService.sendResetOtp(email);
  }

  @Post('reset-pwd')
  async resetPassword(
    @Body('email') email: string,
    @Body('otp') otp: string,
    @Body('newPassword') newPassword: string,
  ) {
    return await this.authService.resetPassword(email, otp, newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.id, res);
  }
}
