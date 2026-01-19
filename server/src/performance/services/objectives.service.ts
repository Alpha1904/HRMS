import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateObjectiveDto } from '../dto/create-objective.dto';
import { UpdateObjectiveDto } from '../dto/update-objective.dto';
import { LogProgressDto } from '../dto/log-progress.dto';
import { AuditContext, PerformanceAuditService } from './performance-audit.service';
import { ObjectiveStatus, Role } from '@prisma/client';

@Injectable()
export class ObjectivesService {
  constructor(private prisma: PrismaService, private audit: PerformanceAuditService) {}

  private async canMutateObjective(
    evaluationId: number,
    currentUser: { id: number; role: Role },
  ) {
    const evaluation = await this.prisma.performanceEvaluation.findUnique({
      where: { id: evaluationId },
      include: { employee: { include: { user: true } } },
    });
    if (!evaluation) throw new NotFoundException('Evaluation not found');

    if (currentUser.role === Role.HR_ADMIN || currentUser.role === Role.SYSTEM_ADMIN) return evaluation;

    const currentProfile = await this.prisma.profile.findUnique({ where: { userId: currentUser.id }, select: { id: true } });
    if (!currentProfile) throw new ForbiddenException('User profile not found');

    if (currentUser.role === Role.EMPLOYEE) {
      if (evaluation.employee.userId !== currentUser.id) throw new ForbiddenException('You can only modify your objectives');
      return evaluation;
    }

    if (currentUser.role === Role.MANAGER) {
      if (evaluation.employee.managerId !== currentProfile.id) {
        throw new ForbiddenException('Managers can only modify objectives for direct reports');
      }
      return evaluation;
    }

    throw new ForbiddenException('Insufficient permission');
  }

  private async assertObjectiveWeightsWithinLimit(evaluationId: number, addWeight?: number, objectiveIdToExclude?: number) {
    const objectives = await this.prisma.employeeObjective.findMany({
      where: { evaluationId },
      select: { id: true, weight: true },
    });

    const sum = objectives
      .filter((o) => o.id !== objectiveIdToExclude)
      .reduce((acc, o) => acc + (o.weight ?? 0), 0);

    const next = sum + (addWeight ?? 0);

    if (next > 1.00001) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: [{ field: 'weight', message: 'Objective weights within an evaluation must not exceed 1.0' }],
      });
    }
  }

  async createObjective(
    evaluationId: number,
    dto: CreateObjectiveDto,
    ctx: AuditContext,
    currentUser: { id: number; role: Role },
  ) {
    await this.canMutateObjective(evaluationId, currentUser);
    await this.assertObjectiveWeightsWithinLimit(evaluationId, dto.weight);

    const created = await this.prisma.employeeObjective.create({
      data: {
        evaluationId,
        title: dto.title,
        description: dto.description,
        targetValue: dto.targetValue,
        status: dto.status ?? ObjectiveStatus.NOT_STARTED,
        weight: dto.weight,
      },
    });

    await this.audit.log(ctx, 'CREATE_OBJECTIVE', 'EmployeeObjective', created.id, undefined, created);

    return created;
  }

  async getObjectives(evaluationId: number) {
    return this.prisma.employeeObjective.findMany({
      where: { evaluationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getObjectiveById(id: number) {
    const objective = await this.prisma.employeeObjective.findUnique({
      where: { id },
      include: {
        progress: { include: { updatedBy: { select: { id: true, fullName: true } } }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!objective) throw new NotFoundException('Objective not found');
    return objective;
  }

  async updateObjective(
    id: number,
    dto: UpdateObjectiveDto,
    ctx: AuditContext,
    currentUser: { id: number; role: Role },
  ) {
    const existing = await this.prisma.employeeObjective.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Objective not found');

    await this.canMutateObjective(existing.evaluationId, currentUser);

    if (dto.weight !== undefined) {
      await this.assertObjectiveWeightsWithinLimit(existing.evaluationId, dto.weight, id);
    }

    const updated = await this.prisma.employeeObjective.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        targetValue: dto.targetValue,
        status: dto.status,
        weight: dto.weight,
      },
    });

    await this.audit.log(ctx, 'UPDATE_OBJECTIVE', 'EmployeeObjective', id, existing, updated);

    return updated;
  }

  async updateObjectiveStatus(
    id: number,
    status: ObjectiveStatus,
    ctx: AuditContext,
    currentUser: { id: number; role: Role },
  ) {
    const existing = await this.prisma.employeeObjective.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Objective not found');

    await this.canMutateObjective(existing.evaluationId, currentUser);

    const updated = await this.prisma.employeeObjective.update({
      where: { id },
      data: { status },
    });

    await this.audit.log(ctx, 'UPDATE_OBJECTIVE_STATUS', 'EmployeeObjective', id, existing, updated);

    return updated;
  }

  async deleteObjective(id: number, ctx: AuditContext, currentUser: { id: number; role: Role }) {
    const existing = await this.prisma.employeeObjective.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Objective not found');

    await this.canMutateObjective(existing.evaluationId, currentUser);

    await this.prisma.employeeObjective.delete({ where: { id } });
    await this.audit.log(ctx, 'DELETE_OBJECTIVE', 'EmployeeObjective', id, existing, undefined);

    return { message: `Objective ${id} deleted` };
  }

  async logProgress(
    objectiveId: number,
    dto: LogProgressDto,
    ctx: AuditContext,
    currentUser: { id: number; role: Role },
  ) {
    const objective = await this.prisma.employeeObjective.findUnique({ where: { id: objectiveId } });
    if (!objective) throw new NotFoundException('Objective not found');

    await this.canMutateObjective(objective.evaluationId, currentUser);

    const profile = await this.prisma.profile.findUnique({ where: { userId: currentUser.id }, select: { id: true } });
    if (!profile) throw new ForbiddenException('User profile not found');

    const created = await this.prisma.objectiveProgress.create({
      data: {
        objectiveId,
        progressNote: dto.progressNote,
        progressRate: dto.progressRate,
        updatedById: profile.id,
      },
      include: { updatedBy: { select: { id: true, fullName: true } } },
    });

    await this.audit.log(ctx, 'LOG_OBJECTIVE_PROGRESS', 'ObjectiveProgress', created.id, undefined, created);

    return created;
  }

  async getProgress(objectiveId: number) {
    const objective = await this.prisma.employeeObjective.findUnique({ where: { id: objectiveId }, select: { id: true, title: true, status: true } });
    if (!objective) throw new NotFoundException('Objective not found');

    const history = await this.prisma.objectiveProgress.findMany({
      where: { objectiveId },
      include: { updatedBy: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return {
      objectiveId,
      title: objective.title,
      currentStatus: objective.status,
      progressHistory: history,
    };
  }
}
