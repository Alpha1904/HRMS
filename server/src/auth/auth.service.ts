import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';
import { EmailService } from 'src/email/email.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Response } from 'express';
import { RegisterDto } from './dto/register.dto';

interface userWithoutPassword extends Omit<User, 'password'> {}
@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private userService: UserService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(data: RegisterDto, res: Response) {
    const user = await this.userService.create(data);
    const tokens = this.generateTokens(user);

    // Set tokens in HTTP-only cookies

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 60 * 1000, // 30 minutes
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const { id, email, role } = user;

    return {
      user: { id, email, role },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto, res: Response) {
    const user = await this.userService.findByemail(loginDto.email);
    const isPasswordValid = await this.comparePassword(
      loginDto.password,
      user.password,
    );

    if (user && isPasswordValid) {
      const tokens = this.generateTokens(user);

      // Set tokens in HTTP-only cookies

      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      const hashedToken = await bcrypt.hash(tokens.refreshToken, 10);

      // Store hashed refresh token in the database
      await this.prismaService.user.update({
        where: { id: user.id },
        data: { refreshTokenHash: hashedToken },
      });

      const { id, email, role } = user;
      return {
        user: { id, email, role },
        ...tokens,
      };
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: 'refresh_secret',
      });

      const user = await this.userService.findOne(payload.id);

      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      const accessToken = this.generateAccessToken(user);

      return { accessToken };
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }
  async logout(userId: number, res: Response) {
    // Invalidate refresh token in DB
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    // Store delete refresh token in the database
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: null },
    });

    // Clear cookies on client-side
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }
  //   Find the current user by ID
  async getUserById(userId: number): Promise<userWithoutPassword> {
    return await this.userService.findOne(userId);
  }

  generateTokens(user: userWithoutPassword) {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    };
  }

  private generateAccessToken(user: userWithoutPassword): string {
    const payload = {
      email: user.email,
      id: user.id,
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      secret: 'jwt_secret',
      expiresIn: '15m',
    });
  }

  private generateRefreshToken(user: userWithoutPassword): string {
    const payload = {
      id: user.id,
    };

    return this.jwtService.sign(payload, {
      secret: 'refresh_secret',
      expiresIn: '7d',
    });
  }
  //-- compare password
  private async comparePassword(
    plainText: string,
    hashed: string | null,
  ): Promise<boolean> {
    if (!hashed) return false;
    return await bcrypt.compare(plainText, hashed);
  }

  //==========   email verification ===========

  async sendOtp(userId: number) {
    try {
      const user = await this.userService.findOne(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      if (user.isEmailVerified) {
        throw new UnprocessableEntityException('Email is already verified');
      }
      const genOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes
      await this.prismaService.user.update({
        where: { id: userId },
        data: { otp: genOtp, otpExpiry },
      });
      // Send OTP via email
      await this.emailService.sendEmail({
        to: user.email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${genOtp}. It is valid for 10 minutes.`,
      });
      return { message: 'OTP sent to your email' };
    } catch (error) {
      console.error('Error generating OTP:', error);
      throw new UnprocessableEntityException('Could not send OTP');
    }
  }

  async verifyOtp(
    userId: number,
    genOtp: string,
  ): Promise<{ message: string }> {
    const user = await this.userService.findOne(userId);
    if (user.isEmailVerified) {
      throw new NotFoundException('User is already verified');
    }
    if (user.otp !== genOtp) {
      throw new UnprocessableEntityException('Invalid OTP');
    }
    const isExpired = !user.otpExpiry || new Date(user.otpExpiry) < new Date();
    if (isExpired) {
      throw new UnprocessableEntityException('OTP expired');
    }
    await this.prismaService.user.update({
      where: { id: userId },
      data: { isEmailVerified: true, otp: null, otpExpiry: null },
    });
    return { message: 'Email verified successfully' };
  }

  // ==========   reset password verification ===========

  async sendResetOtp(email: string) {
    try {
      const user = await this.userService.findByemail(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes
      await this.prismaService.user.update({
        where: { id: user.id },
        data: { resetOtp: otp, resetOtpExpiry: otpExpiry },
      });
      // Send OTP via email
      await this.emailService.sendEmail({
        to: user.email,
        subject: 'Your Password Reset OTP',
        text: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
      });
      return { message: 'OTP sent to your email' };
    } catch (error) {
      console.error('Error generating OTP:', error);
      throw new UnprocessableEntityException('Could not send OTP');
    }
  }

  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      const user = await this.userService.findByemail(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const isExpired =
        !user.resetOtpExpiry || new Date(user.resetOtpExpiry) < new Date();
      if (isExpired) {
        throw new UnprocessableEntityException('OTP expired');
      }
      if (user.resetOtp !== otp) {
        throw new UnprocessableEntityException('Invalid OTP');
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.prismaService.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetOtp: null,
          resetOtpExpiry: null,
        },
      });
      return { message: 'Password reset successfully' };
    } catch (e) {
      console.log('Error resetting password:', e);
      throw new UnprocessableEntityException('Could not reset password');
    }
  }

  private sixDigitOtp: string = Math.floor(
    100000 + Math.random() * 900000,
  ).toString();
}
