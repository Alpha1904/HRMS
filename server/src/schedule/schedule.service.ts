import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { QueryShiftDto } from './dto/query-shift.dto';
import { Prisma, Shift, ShiftChangeRequest, ShiftChangeStatus } from '@prisma/client';
import { ProfileService } from '../profile/profile.service';
import { WorkScheduleTemplate } from '@prisma/client';
import { CreateWorkScheduleTemplateDto } from './dto/create-template.dto';
import { UpdateWorkScheduleTemplateDto } from './dto/update-template.dto';

@Injectable()
export class ScheduleService {
  constructor(
    private prisma: PrismaService,
    private profileService: ProfileService, // Used to validate profile IDs
  ) {}

  /**
   * Helper to convert HH:MM string to a Date object (for Prisma Time type)
   */
  private convertToTime(time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setUTCHours(hours, minutes, 0, 0); // Use UTC to store time-only
    return date;
  }

  /**
   * ### Feature: Schedule Visualization (Read)
   * Finds all shifts based on query parameters (date range, profile, manager).
   * Includes related profile data, template info, and change requests.
   */
  async findShifts(query: QueryShiftDto): Promise<any[]> {
    const where: Prisma.ShiftWhereInput = {};

    if (query.profileId) {
      where.profile = {
        some: {
          id: query.profileId,
        },
      };
    }

    if (query.managerId) {
      where.profile = {
        some: {
          managerId: query.managerId,
        },
      };
    }

    if (query.templateId) {
      where.templateId = query.templateId;
    }

    // Filter by date range (essential for calendar views)
    if (query.startDate && query.endDate) {
      where.date = {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate),
      };
    }

    return this.prisma.shift.findMany({
      where,
      include: {
        profile: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            position: true,
            department: true,
            site: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        changeRequests: {
          select: {
            id: true,
            status: true,
            reason: true,
            createdAt: true,
          },
          where: {
            status: 'PENDING',
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  /**
   * ### Feature: Get Single Shift (Read)
   * Retrieves a specific shift with all its relations.
   */
  async findShiftById(id: number): Promise<any> {
    const shift = await this.prisma.shift.findUnique({
      where: { id },
      include: {
        profile: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            position: true,
            department: true,
            site: true,
            managerId: true,
          },
        },
        template: true,
        changeRequests: {
          include: {
            requester: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!shift) {
      throw new NotFoundException(`Shift with ID ${id} not found.`);
    }

    return shift;
  }

  /**
   * ### Feature: Create/Modify Schedules (Write)
   * Creates one or more shifts for a list of employees.
   * Validates: profile existence, time format, no overlaps, relations integrity.
   */
  async createShifts(
    dto: CreateShiftDto,
  ): Promise<{ count: number; shifts: any[] }> {
    const { profileIds, date, startTime, endTime, templateId, ...rest } = dto;

    // Validate all profiles exist
    const profiles = await this.prisma.profile.findMany({
      where: { id: { in: profileIds } },
      select: { id: true, fullName: true },
    });

    if (profiles.length !== profileIds.length) {
      const foundIds = profiles.map((p) => p.id);
      const notFound = profileIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(
        `The following profile IDs do not exist: ${notFound.join(', ')}`,
      );
    }

    // Validate template exists if provided
    if (templateId) {
      const template = await this.prisma.workScheduleTemplate.findUnique({
        where: { id: templateId },
      });
      if (!template) {
        throw new BadRequestException(`Template with ID ${templateId} not found.`);
      }
    }

    const shiftDate = new Date(date);
    const shiftStartTime = this.convertToTime(startTime);
    const shiftEndTime = this.convertToTime(endTime);

    if (shiftEndTime <= shiftStartTime) {
      throw new BadRequestException('End time must be after start time.');
    }

    // Check for overlapping shifts for all specified profiles
    const overlappingShifts = await this.prisma.shift.findMany({
      where: {
        profile: {
          some: {
            id: { in: profileIds },
          },
        },
        date: shiftDate,
        // Overlap logic: (StartA < EndB) and (EndA > StartB)
        startTime: { lt: shiftEndTime },
        endTime: { gt: shiftStartTime },
      },
      include: {
        profile: {
          select: { id: true, fullName: true },
          where: { id: { in: profileIds } },
        },
      },
    });

    if (overlappingShifts.length > 0) {
      const conflictProfiles = new Set<string>();
      overlappingShifts.forEach((s) => {
        s.profile.forEach((p) => conflictProfiles.add(p.fullName));
      });
      throw new BadRequestException(
        `Overlap detected. The following profiles are already scheduled at this time: ${Array.from(conflictProfiles).join(', ')}`,
      );
    }

    // Create shifts for each profile
    const shifts: Shift[] = [];
    for (const profileId of profileIds) {
      const shift = await this.prisma.shift.create({
        data: {
          profile: {
            connect: [{ id: profileId }],
          },
          date: shiftDate,
          startTime: shiftStartTime,
          endTime: shiftEndTime,
          template: templateId ? { connect: { id: templateId } } : undefined,
          ...rest,
        },
        include: {
          profile: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              position: true,
              department: true,
              manager: {
                select: {
                  id: true,
                  fullName: true,
                },
              }
            },
          },
          template: true,
        },
      });
      shifts.push(shift);
    }

    return {
      count: shifts.length,
      shifts,
    };
  }

  /**
   * ### Feature: Update Shift
   * Updates shift times or template for a specific shift.
   */
  async updateShift(
    id: number,
    updateData: {
      startTime?: string;
      endTime?: string;
      date?: string;
      title?: string;
      description?: string;
      templateId?: number | null;
    },
  ): Promise<any> {
    const shift = await this.findShiftById(id);

    // Validate new times if provided
    if (updateData.startTime || updateData.endTime) {
      const newStartTime = updateData.startTime
        ? this.convertToTime(updateData.startTime)
        : shift.startTime;
      const newEndTime = updateData.endTime
        ? this.convertToTime(updateData.endTime)
        : shift.endTime;

      if (newEndTime <= newStartTime) {
        throw new BadRequestException('End time must be after start time.');
      }

      // Check for overlaps with new time
      const newDate = updateData.date ? new Date(updateData.date) : shift.date;
      const overlappingShifts = await this.prisma.shift.findMany({
        where: {
          id: { not: id },
          profile: {
            some: {
              id: { in: shift.profile.map((p) => p.id) },
            },
          },
          date: newDate,
          startTime: { lt: newEndTime },
          endTime: { gt: newStartTime },
        },
      });

      if (overlappingShifts.length > 0) {
        throw new BadRequestException(
          'New time slot creates an overlap with an existing shift.',
        );
      }
    }

    // Validate template exists if provided
    if (updateData.templateId) {
      const template = await this.prisma.workScheduleTemplate.findUnique({
        where: { id: updateData.templateId },
      });
      if (!template) {
        throw new BadRequestException(
          `Template with ID ${updateData.templateId} not found.`,
        );
      }
    }

    const dataToUpdate: any = {};
    if (updateData.startTime) {
      dataToUpdate.startTime = this.convertToTime(updateData.startTime);
    }
    if (updateData.endTime) {
      dataToUpdate.endTime = this.convertToTime(updateData.endTime);
    }
    if (updateData.date) {
      dataToUpdate.date = new Date(updateData.date);
    }
    if (updateData.templateId !== undefined) {
      dataToUpdate.template = updateData.templateId
        ? { connect: { id: updateData.templateId } }
        : { disconnect: true };
    }
    if (updateData.title !== undefined) {
      dataToUpdate.title = updateData.title;
    }
    if (updateData.description !== undefined) {
      dataToUpdate.description = updateData.description;
    }


    return this.prisma.shift.update({
      where: { id },
      data: dataToUpdate,
      include: {
        profile: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            position: true,
          },
        },
        template: true,
        changeRequests: {
          where: { status: 'PENDING' },
        },
      },
    });
  }

  /**
   * ### Feature: Modify Schedules (Delete)
   * Deletes a specific shift. Cannot delete if there are pending change requests.
   */
  async deleteShift(id: number): Promise<any> {
    const shift = await this.findShiftById(id);

    // Check for pending change requests
    const pendingRequests = await this.prisma.shiftChangeRequest.findMany({
      where: { shiftId: id, status: 'PENDING' },
    });

    if (pendingRequests.length > 0) {
      throw new BadRequestException(
        `Cannot delete shift. There are ${pendingRequests.length} pending change request(s).`,
      );
    }

    // Delete all related change requests first
    await this.prisma.shiftChangeRequest.deleteMany({
      where: { shiftId: id },
    });

    return this.prisma.shift.delete({
      where: { id },
      include: {
        profile: {
          select: { id: true, fullName: true },
        },
      },
    });
  }

  /**
   * ### Feature: Shift Change Requests
   * Creates a change request for a shift (employee can request changes).
   */
  async createShiftChangeRequest(
    shiftId: number,
    requesterId: number,
    data: {
      reason?: string;
      newDate?: string;
      newStartTime?: string;
      newEndTime?: string;
    },
  ): Promise<ShiftChangeRequest> {
    const shift = await this.findShiftById(shiftId);

    // Verify requester is assigned to this shift
    const isAssigned = shift.profile.some((p) => p.id === requesterId);
    if (!isAssigned) {
      throw new ForbiddenException(
        'Only employees assigned to this shift can request changes.',
      );
    }

    // Validate new times if provided
    if (data.newStartTime || data.newEndTime) {
      const newStartTime = data.newStartTime
        ? this.convertToTime(data.newStartTime)
        : shift.startTime;
      const newEndTime = data.newEndTime
        ? this.convertToTime(data.newEndTime)
        : shift.endTime;

      if (newEndTime <= newStartTime) {
        throw new BadRequestException('End time must be after start time.');
      }
    }

    return this.prisma.shiftChangeRequest.create({
      data: {
        shift: { connect: { id: shiftId } },
        requester: { connect: { id: requesterId } },
        reason: data.reason,
        newDate: data.newDate ? new Date(data.newDate) : undefined,
        newStartTime: data.newStartTime
          ? this.convertToTime(data.newStartTime)
          : undefined,
        newEndTime: data.newEndTime
          ? this.convertToTime(data.newEndTime)
          : undefined,
        status: 'PENDING',
      },
      include: {
        shift: true,
        requester: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });
  }

  /**
   * ### Feature: Get Shift Change Requests
   * Retrieves all change requests for a specific shift.
   */
  async getShiftChangeRequests(shiftId: number): Promise<any[]> {
    const shift = await this.findShiftById(shiftId);

    return this.prisma.shiftChangeRequest.findMany({
      where: { shiftId },
      include: {
        requester: {
          select: { id: true, fullName: true, avatarUrl: true, position: true },
        },
        shift: {
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * ### Feature: Approve/Reject Shift Change Request
   * Manager/HR approves or rejects a pending change request.
   */
  async processShiftChangeRequest(
    requestId: number,
    status: 'APPROVED' | 'REJECTED',
    feedback?: string,
    processedById?: number,
  ): Promise<ShiftChangeRequest> {
    const request = await this.prisma.shiftChangeRequest.findUnique({
      where: { id: requestId },
      include: { shift: true },
    });

    if (!request) {
      throw new NotFoundException(
        `Change request with ID ${requestId} not found.`,
      );
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(
        `Request is already ${request.status.toLowerCase()}. Cannot process again.`,
      );
    }

    // If approved, apply the changes to the shift
    if (status === 'APPROVED' && request.newStartTime) {
      await this.prisma.shift.update({
        where: { id: request.shiftId },
        data: {
          date: request.newDate || request.shift.date,
          startTime: request.newStartTime || request.shift.startTime,
          endTime: request.newEndTime || request.shift.endTime,
        },
      });
    }

    return this.prisma.shiftChangeRequest.update({
      where: { id: requestId },
      data: {
        status,
        managerFeedback: feedback,
        processedById,
      },
      include: {
        requester: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        shift: true,
      },
    });
  }

  /**
   * ### Feature: Cancel Shift Change Request
   * Employee or manager can cancel a pending request.
   */
  async cancelShiftChangeRequest(requestId: number): Promise<ShiftChangeRequest> {
    const request = await this.prisma.shiftChangeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException(
        `Change request with ID ${requestId} not found.`,
      );
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot cancel a ${request.status.toLowerCase()} request.`,
      );
    }

    return this.prisma.shiftChangeRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
    });
  }

  // ========================================
  // WORK SCHEDULE TEMPLATE MANAGEMENT
  // ========================================

  /**
   * Creates a new reusable work schedule template. (HR/Admin action)
   */
  async createTemplate(
    dto: CreateWorkScheduleTemplateDto,
  ): Promise<WorkScheduleTemplate> {
    // Note: Validation on rotation fields is handled by DTO's ValidateIf
    return this.prisma.workScheduleTemplate.create({
      data: dto,
    });
  }

  /**
   * Retrieves all available work schedule templates with shift counts.
   */
  async findAllTemplates(): Promise<any[]> {
    return this.prisma.workScheduleTemplate.findMany({
      include: {
        shifts: {
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
          },
          take: 5, // Show last 5 shifts
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Retrieves a single template by ID with all related shifts.
   */
  async findOneTemplate(id: number): Promise<any> {
    const template = await this.prisma.workScheduleTemplate.findUnique({
      where: { id },
      include: {
        shifts: {
          include: {
            profile: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                position: true,
              },
            },
          },
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found.`);
    }

    return template;
  }

  /**
   * Updates an existing work schedule template.
   */
  async updateTemplate(
    id: number,
    dto: UpdateWorkScheduleTemplateDto,
  ): Promise<WorkScheduleTemplate> {
    try {
      return await this.prisma.workScheduleTemplate.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      // Catch error if ID doesn't exist
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Template with ID ${id} not found.`);
      }
      throw error;
    }
  }

  /**
   * Deletes a work schedule template.
   * Cannot delete if currently linked to existing shifts.
   */
  async deleteTemplate(id: number): Promise<WorkScheduleTemplate> {
    // Check for existing shifts linked to this template
    const linkedShifts = await this.prisma.shift.findMany({
      where: { templateId: id },
      select: { id: true, date: true },
    });

    if (linkedShifts.length > 0) {
      throw new BadRequestException(
        `Cannot delete template ID ${id}. It is currently linked to ${linkedShifts.length} existing shift(s). Please reassign or delete those shifts first.`,
      );
    }

    try {
      return await this.prisma.workScheduleTemplate.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Template with ID ${id} not found.`);
      }
      throw error;
    }
  }

  /**
   * ### Feature: Get Shifts by Template
   * Retrieves all shifts generated from a specific template.
   */
  async getShiftsByTemplate(templateId: number): Promise<any[]> {
    const template = await this.findOneTemplate(templateId);

    return this.prisma.shift.findMany({
      where: { templateId },
      include: {
        profile: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            position: true,
            department: true,
          },
        },
        changeRequests: {
          where: { status: 'PENDING' },
          select: {
            id: true,
            reason: true,
            createdAt: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  /**
   * ### Feature: Get Shifts by Profile
   * Retrieves all shifts for a specific employee.
   */
  async getShiftsByProfile(
    profileId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<any[]> {
    // Verify profile exists
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { fullName: true },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with ID ${profileId} not found.`);
    }

    const where: Prisma.ShiftWhereInput = {
      profile: {
        some: {
          id: profileId,
        },
      },
    };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    return this.prisma.shift.findMany({
      where,
      include: {
        template: {
          select: { id: true, name: true },
        },
        changeRequests: {
          include: {
            requester: {
              select: { fullName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }
}