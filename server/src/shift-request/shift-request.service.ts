import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftRequestDto } from './dto/create-shift-request.dto';
import { ActionShiftRequestDto } from './dto/action-shift-request.dto';
import { Prisma, ShiftChangeStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProfileService } from '../profile/profile.service';

@Injectable()
export class ShiftRequestService {
  constructor(
    private prisma: PrismaService,
    private profileService: ProfileService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Helper to convert HH:MM string to a Date object
   */
  private convertToTime(time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setUTCHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * ### Feature: Employee Submits Change Request
   */
  async createRequest(dto: CreateShiftRequestDto) {
    const {
      shiftId,
      requesterId,
      newDate,
      newStartTime,
      newEndTime,
      reason,
    } = dto;

    // 1. Find the original shift
    const shift = await this.prisma.shift.findUnique({ where: { id: shiftId } });
    if (!shift) {
      throw new NotFoundException(`Shift with ID ${shiftId} not found.`);
    }

    // 2. Validate ownership
    if (shift.profileId !== requesterId) {
      throw new UnauthorizedException('You can only request changes for your own shifts.');
    }

    // 3. Check for existing pending requests
    const pendingRequest = await this.prisma.shiftChangeRequest.findFirst({
      where: { shiftId, status: 'PENDING' },
    });
    if (pendingRequest) {
      throw new BadRequestException(
        'There is already a PENDING change request for this shift.',
      );
    }

    // 4. Create the request
    const newRequest = await this.prisma.shiftChangeRequest.create({
      data: {
        shiftId,
        requesterId,
        reason,
        newDate: newDate ? new Date(newDate) : null,
        newStartTime: newStartTime ? this.convertToTime(newStartTime) : null,
        newEndTime: newEndTime ? this.convertToTime(newEndTime) : null,
        status: 'PENDING',
      },
      include: {
        requester: { select: { fullName: true, managerId: true } }
      }
    });
    
    // 5. Emit event for manager notification
    if (newRequest.requester.managerId) {
        const managerProfile = await this.profileService.findOne(newRequest.requester.managerId);
        this.eventEmitter.emit('shift.request.created', {
            request: newRequest,
            managerUserId: managerProfile.userId,
        });
    }

    return newRequest;
  }

  /**
   * ### Feature: Manager Actions Change Request (Approve/Reject)
   */
  async actionRequest(id: number, managerId: number, dto: ActionShiftRequestDto) {
    const { status, managerFeedback } = dto;

    // 1. Find the request
    const request = await this.prisma.shiftChangeRequest.findUnique({
      where: { id },
      include: { shift: true, requester: true },
    });

    if (!request) {
      throw new NotFoundException(`Request with ID ${id} not found.`);
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException('This request is no longer PENDING.');
    }

    // --- Start Atomic Transaction ---
    const result = await this.prisma.$transaction(async (tx) => {
      // Step A: Update the Request
      const updatedRequest = await tx.shiftChangeRequest.update({
        where: { id },
        data: {
          status,
          processedById: managerId,
          managerFeedback,
        },
      });

      // Step B: If APPROVED, update the original Shift
      if (status === 'APPROVED') {
        await tx.shift.update({
          where: { id: request.shiftId },
          data: {
            date: request.newDate ?? request.shift.date,
            startTime: request.newStartTime ?? request.shift.startTime,
            endTime: request.newEndTime ?? request.shift.endTime,
          },
        });
      }
      return updatedRequest;
    });
    // --- End Transaction ---

    // 3. Emit event for employee notification
    this.eventEmitter.emit('shift.request.actioned', {
        request: result,
        requesterUserId: request.requester.userId,
    });

    return result;
  }

  /**
   * ### Feature: Get Pending Requests (Manager View)
   */
  async getPendingRequests(managerId: number) {
    return this.prisma.shiftChangeRequest.findMany({
      where: {
        status: 'PENDING',
        requester: {
          managerId: managerId, // Find all requests from employees who report to this manager
        },
      },
      include: {
        requester: { select: { fullName: true } },
        shift: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}