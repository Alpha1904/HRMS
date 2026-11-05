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
export class EvaluationAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as { id: number; role: Role; tenantId?: string; profile?: { id: number; department?: string } };

    const evaluationIdRaw =
      req.params?.evaluationId ?? req.params?.id ?? req.params?.evaluationID;

    const evaluationId = Number(evaluationIdRaw);
    if (!Number.isFinite(evaluationId)) {
      return true;
    }

    const evaluation = await this.prisma.performanceEvaluation.findUnique({
      where: { id: evaluationId },
      include: {
        employee: {
          include: {
            user: { select: { id: true, tenantId: true } },
          },
        },
      },
    });

    if (!evaluation) {
      throw new NotFoundException('Evaluation not found');
    }

    if (user.tenantId && evaluation.tenantId && user.tenantId !== evaluation.tenantId) {
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
      if (!profile) {
        throw new ForbiddenException('User profile not found');
      }
      user.profile = { id: profile.id, department: profile.department ?? undefined };
    }

    if (user.role === Role.EMPLOYEE) {
      if (evaluation.employee.userId !== user.id) {
        throw new ForbiddenException('You can only access your own evaluations');
      }
      return true;
    }

    if (user.role === Role.MANAGER) {
      if (evaluation.employee.department && user.profile?.department) {
        if (evaluation.employee.department === user.profile.department) {
          return true;
        }
      }

      if (evaluation.employee.managerId === user.profile?.id) {
        return true;
      }

      throw new ForbiddenException('Managers can only access their department or direct reports');
    }

    throw new ForbiddenException('Insufficient permission');
  }
}
