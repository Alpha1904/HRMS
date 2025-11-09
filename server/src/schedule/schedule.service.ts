import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { QueryShiftDto } from './dto/query-shift.dto';
import { Prisma, Shift } from '@prisma/client';
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
   */
  async findShifts(query: QueryShiftDto): Promise<Shift[]> {
    const where: Prisma.ShiftWhereInput = {};

    if (query.profileId) {
      where.profileId = query.profileId;
    }

    if (query.managerId) {
      where.profile = {
        managerId: query.managerId,
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
          select: { fullName: true, avatarUrl: true },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * ### Feature: Create/Modify Schedules (Write)
   * Creates one or more shifts for a list of employees.
   */
  async createShifts(
    dto: CreateShiftDto,
  ): Promise<{ count: number; shifts: Shift[] }> {
    const { profileIds, date, startTime, endTime, templateId } = dto;

    const shiftDate = new Date(date);
    const shiftStartTime = this.convertToTime(startTime);
    const shiftEndTime = this.convertToTime(endTime);

    if (shiftEndTime <= shiftStartTime) {
      throw new BadRequestException('End time must be after start time.');
    }

    // 1. Check for overlapping shifts for all specified profiles
    const overlappingShifts = await this.prisma.shift.findMany({
      where: {
        profileId: { in: profileIds },
        date: shiftDate,
        // Overlap logic: (StartA < EndB) and (EndA > StartB)
        startTime: { lt: shiftEndTime },
        endTime: { gt: shiftStartTime },
      },
      include: {
        profile: { select: { fullName: true } },
      },
    });

    if (overlappingShifts.length > 0) {
      const names = overlappingShifts
        .map((s) => s.profile.fullName)
        .join(', ');
      throw new BadRequestException(
        `Overlap detected. The following profiles are already scheduled at this time: ${names}`,
      );
    }

    // 2. Create the data for Prisma's createMany
    const dataToCreate: Prisma.ShiftCreateManyInput[] = profileIds.map(
      (profileId) => ({
        profileId,
        date: shiftDate,
        startTime: shiftStartTime,
        endTime: shiftEndTime,
        templateId,
      }),
    );

    // 3. Create the shifts
    const result = await this.prisma.shift.createMany({
      data: dataToCreate,
      skipDuplicates: true, // Should not be needed due to overlap check, but safe
    });

    // 4. Fetch the created shifts to return them
    const createdShifts = await this.prisma.shift.findMany({
      where: {
        date: shiftDate,
        startTime: shiftStartTime,
        profileId: { in: profileIds },
      },
    });

    return {
      count: result.count,
      shifts: createdShifts,
    };
  }

  /**
   * ### Feature: Modify Schedules (Delete)
   * Deletes a single shift assignment.
   */
  async deleteShift(id: number): Promise<Shift> {
    // 1. Check if shift exists
    const shift = await this.prisma.shift.findUnique({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`Shift with ID ${id} not found.`);
    }

    // 2. Check for pending change requests (optional but good)
    const pendingRequests = await this.prisma.shiftChangeRequest.count({
      where: { shiftId: id, status: 'PENDING' },
    });

    if (pendingRequests > 0) {
      throw new BadRequestException(
        'Cannot delete shift. There are pending change requests.',
      );
    }

    return this.prisma.shift.delete({
      where: { id },
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
   * Retrieves all available work schedule templates.
   */
  async findAllTemplates(): Promise<WorkScheduleTemplate[]> {
    return this.prisma.workScheduleTemplate.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Retrieves a single template by ID.
   */
  async findOneTemplate(id: number): Promise<WorkScheduleTemplate> {
    const template = await this.prisma.workScheduleTemplate.findUnique({
      where: { id },
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
   * NOTE: We should block deletion if the template is currently linked to any existing shifts.
   */
  async deleteTemplate(id: number): Promise<WorkScheduleTemplate> {
    // 1. Check for existing shifts linked to this template
    const linkedShiftsCount = await this.prisma.shift.count({
      where: { templateId: id },
    });

    if (linkedShiftsCount > 0) {
      throw new BadRequestException(
        `Cannot delete template ID ${id}. It is currently linked to ${linkedShiftsCount} existing shifts.`,
      );
    }

    // 2. Delete the template
    try {
      return await this.prisma.workScheduleTemplate.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Template with ID ${id} not found.`);
      }
      throw error;
    }
  }
}