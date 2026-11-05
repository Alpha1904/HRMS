import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditContext {
  performedById: number;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class PaymentAuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    ctx: AuditContext,
    action: string,
    resource: string,
    resourceId?: number,
    oldValues?: unknown,
    newValues?: unknown,
  ) {
    return this.prisma.auditLog.create({
      data: {
        action,
        resource,
        resourceId,
        oldValues: oldValues as any,
        newValues: newValues as any,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        performedById: ctx.performedById,
      },
    });
  }
}
