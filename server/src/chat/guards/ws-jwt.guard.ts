import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private logger: Logger = new Logger('WsJwtGuard');

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient();
      // Extract token from handshake headers or query string
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers.authorization?.split(' ')[1] ||
        client.handshake.query?.token;

      if (!token) throw new WsException('Unauthorized');

      // 1. Verify JWT
      const payload = this.jwtService.verify(token, { secret: 'jwt_secret' });
      
      // 2. HRMS Check: Ensure employee still exists and is ACTIVE
      const userId = Number(payload?.id ?? payload?.sub);
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || user.isActive === false) {
        throw new WsException('User is no longer active in HRMS');
      }

      //klkhbklb
      // 3. Attach user to socket for global access
      client.user = user;
      return true;
    } catch (err) {
      this.logger.error('WS Auth Failed');
      return false;
    }
  }
}