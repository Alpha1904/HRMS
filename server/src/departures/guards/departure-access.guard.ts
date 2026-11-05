import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class DepartureAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as { id: number; role: Role; tenantId?: string; profile?: { id: number; department?: string } };

    const departureIdRaw = req.params?.departureId ?? req.params?.id;
    const departureId = Number(departureIdRaw);
    if (!Number.isFinite(departureId)) {
      return true;
    }

    const departure = await this.prisma.departure.findUnique({
      where: { id: departureId },
      include: {
        employee: { select: { id: true, userId: true, managerId: true, department: true } },
      },
    });

    if (!departure) throw new NotFoundException('Departure not found');

    if (user.tenantId && departure.tenantId && user.tenantId !== departure.tenantId) {
      throw new ForbiddenException('Cross-tenant access denied');
    }

    if (user.role === Role.HR_ADMIN || user.role === Role.SYSTEM_ADMIN) {
      return true;
    }

    const currentProfileId = user.profile?.id;
    if (!currentProfileId) {
      const profile = await this.prisma.profile.findUnique({
        where: { userId: user.id },
        select: { id: true, department: true },
      });
      if (!profile) throw new ForbiddenException('User profile not found');
      user.profile = { id: profile.id, department: profile.department ?? undefined };
    }

    if (user.role === Role.EMPLOYEE) {
      if (departure.employee.userId !== user.id) {
        throw new ForbiddenException('You can only access your own departures');
      }
      return true;
    }

    if (user.role === Role.MANAGER) {
      if (departure.employee.managerId === user.profile?.id) {
        return true;
      }
      throw new ForbiddenException('Managers can only access departures for their direct reports');
    }

    throw new ForbiddenException('Insufficient permission');
  }
}
