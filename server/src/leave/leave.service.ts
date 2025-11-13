import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileService } from '../profile/profile.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import {
  Leave,
  LeaveBalance,
  LeaveType,
  Prisma,
  Profile,
  Role,
} from '@prisma/client';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class LeaveService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private profileService: ProfileService, // Used to check if profile exists
  ) {}

  private calculateDaysRequested(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    // Convert to days and add 1 for inclusive count
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays <= 0) {
      throw new BadRequestException(
        'End date must be after or on the start date.',
      );
    }
    return diffDays;
  }

  async createRequest(dto: CreateLeaveDto): Promise<Leave> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const currentYear = startDate.getFullYear();

    // 1. Get the employee's profile with user relation
    const profile = await this.prisma.profile.findUnique({
      where: { id: dto.profileId },
      include: {
        user: {
          select: {
            role: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException(
        `Profile with ID ${dto.profileId} not found.`,
      );
    }

    // 2. Calculate days requested
    const daysRequested = this.calculateDaysRequested(startDate, endDate);

    // 3. Find or Create the LeaveBalance ("JIT Provisioning")
    // This is the core logic that uses the LeavePolicy
    const balance = await this.findOrCreateBalance(
      profile.id,
      dto.type,
      currentYear,
      profile, // Pass the full profile for policy matching
    );

    const daysAvailable = balance.totalAllocated - balance.daysUsed;

    // 4. Validate the request against the available balance
    if (daysRequested > daysAvailable) {
      throw new BadRequestException(
        `Insufficient balance. Requested ${daysRequested} days, but only ${daysAvailable} days are available for ${dto.type}.`,
      );
    }

    // 5. Create the new PENDING leave request
    const newLeave = await this.prisma.leave.create({
      data: {
        profileId: dto.profileId,
        type: dto.type,
        startDate,
        endDate,
        daysRequested: daysRequested,
        reason: dto.reason,
        managerId: profile.managerId, // Get manager from the profile
      },
    });

    //  EMIT THE EVENT
    if (newLeave.managerId) {
      this.eventEmitter.emit('leave.created', {
        leave: newLeave,
        profile, // Pass the profile along with the leave object
      });
    }

    return newLeave;
  }

  /**
   * ### NEW HELPER METHOD: findOrCreateBalance
   * This is the "smart" logic that uses the LeavePolicy.
   */
  private async findOrCreateBalance(
    profileId: number,
    leaveType: LeaveType,
    year: number,
    profile: Profile & { user: { role: Role } }, // Profile with user relation
  ): Promise<LeaveBalance> {
    // 1. Try to find the existing balance
    const existingBalance = await this.prisma.leaveBalance.findUnique({
      where: {
        profileId_leaveType_year: {
          profileId,
          leaveType,
          year,
        },
      },
    });

    if (existingBalance) {
      return existingBalance; // Found it! Return immediately.
    }

    // 2. Not found. We must find a *policy* to create one.
    // Build a query to find the *best* matching policy.
    const policy = await this.prisma.leavePolicy.findFirst({
      where: {
        leaveType: leaveType,
        // Match profile attributes. null policies apply to all.
        AND: [
          {
            OR: [
              { contractType: profile.contractType },
              { contractType: null },
            ],
          },
          { OR: [{ role: profile.user.role }, { role: null }] },
          { OR: [{ department: profile.department }, { department: null }] },
          { OR: [{ site: profile.site }, { site: null }] },
          // TODO: Add seniority logic
        ],
      },
      // Order by specificity (most specific rule wins)
      // This is a simplified "priority" logic
      orderBy: [
        { contractType: 'desc' }, // Non-nulls first
        { role: 'desc' },
        { department: 'desc' },
      ],
    });

    // 3. If no policy is found, this employee is not eligible.
    if (!policy) {
      throw new BadRequestException(
        `You are not eligible for ${leaveType} leave as no matching leave policy was found.`,
      );
    }

    // 4. Policy found! Create the new balance record.
    try {
      const newBalance = await this.prisma.leaveBalance.create({
        data: {
          profileId,
          leaveType,
          year,
          totalAllocated: policy.daysAllocated,
          daysUsed: 0,
          daysCarriedOver: 0, // TODO: Implement carry-over logic
        },
      });
      return newBalance;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        // This is a "race condition": two requests tried to create the
        // balance at the same time. The other one won.
        // We can safely await the re-fetch of the one that was just created.
        const balance = await this.prisma.leaveBalance.findUnique({
          where: {
            profileId_leaveType_year: {
              profileId,
              leaveType,
              year,
            },
          },
        });
        if (!balance) {
          throw new InternalServerErrorException(
            'Failed to create leave balance.',
          );
        }
        return balance;
      }
      throw new InternalServerErrorException('Error creating leave balance.');
    }
  }

  /**
   * ### Feature: Leave Balance Retrieval
   * This is necessary for the front-end to show "days remaining".
   */
  async getBalancesByProfile(profileId: number): Promise<LeaveBalance[]> {
    await this.profileService.findOne(profileId);

    return this.prisma.leaveBalance.findMany({
      where: { profileId },
      orderBy: { year: 'desc' },
    });
  }

  // --- Leave Approval/Rejection methods ---
  async approveOrReject(
    leaveId: number,
    dto: UpdateLeaveStatusDto,
  ): Promise<Leave> {
    // 1. Find the existing leave request
    const leave = await this.prisma.leave.findUnique({
      where: { id: leaveId },
    });

    if (!leave) {
      throw new NotFoundException(
        `Leave request with ID ${leaveId} not found.`,
      );
    }

    // Test my reasoning: Does this allow managers to approve an already approved leave? No.
    if (leave.status !== 'PENDING') {
      throw new BadRequestException(
        `Leave request ${leaveId} has already been ${leave.status}. Only PENDING requests can be actioned.`,
      );
    }

    const year = leave.startDate.getFullYear();
    const daysRequested = leave.daysRequested;
    const profileId = leave.profileId;
    const leaveType = leave.type;

    // Start the atomic transaction
    return this.prisma.$transaction(async (tx) => {
      // Step A: Update the Leave record (either APPROVED or REJECTED)
      const updatedLeave = await tx.leave.update({
        where: { id: leaveId },
        data: {
          status: dto.status,
          managerId: dto.managerId,
          reason: dto.reason,
        },
      });

      // Step B: If APPROVED, update the LeaveBalance
      if (dto.status === 'APPROVED') {
        // Optional Pre-check (Good practice for race conditions)
        const balance = await tx.leaveBalance.findUnique({
          where: {
            profileId_leaveType_year: {
              profileId: profileId,
              leaveType: leaveType,
              year: year,
            },
          },
        });

        if (
          !balance ||
          balance.totalAllocated - balance.daysUsed < daysRequested
        ) {
          // Throwing here will automatically trigger a full rollback of Step A
          throw new BadRequestException(
            'Balance insufficient at time of approval. Transaction rolled back.',
          );
        }

        // CRITICAL UPDATE: Safely decrement the available balance by incrementing daysUsed
        await tx.leaveBalance.update({
          where: {
            profileId_leaveType_year: {
              profileId: profileId,
              leaveType: leaveType,
              year: year,
            },
          },
          data: {
            daysUsed: {
              increment: daysRequested, // Use 'increment' to safely update without manual read/write
            },
          },
        });
      }
      
      // EMIT THE ACTION EVENT
      this.eventEmitter.emit('leave.actioned', {
        leave: updatedLeave,
        profile: await this.profileService.findOne(updatedLeave.profileId), // Fetch and pass the profile
        status: dto.status, // "APPROVED" or "REJECTED"
      });

      return updatedLeave;
    });
  }
}
