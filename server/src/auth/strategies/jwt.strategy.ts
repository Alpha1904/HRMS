import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: 'jwt_secret',
    });
  }

  async validate(payload: any) {
    try {
      const user = await this.authService.getUserById(payload.id);

      return {
        id: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

export const cookieExtractor = (req: Request): string | null => {
  return (
    req.cookies?.['accessToken'] ||
    ExtractJwt.fromAuthHeaderAsBearerToken()(req)
  );
};
