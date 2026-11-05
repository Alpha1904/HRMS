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
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

export const cookieExtractor = (req: Request): string | null => {
  const token = req.cookies?.['accessToken'];
  const bearerToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  
  console.log('[JWT] Attempting to extract token...');
  console.log('[JWT] Cookies:', req.cookies);
  console.log('[JWT] AccessToken from cookie:', token ? 'Found' : 'Not found');
  console.log('[JWT] Bearer token:', bearerToken ? 'Found' : 'Not found');
  
  const result = token || bearerToken;
  console.log('[JWT] Final token:', result ? 'Found' : 'Not found');
  
  return result || null;
};
