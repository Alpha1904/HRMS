import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Leave, Profile, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification.service';

// Define a type for the event payload
interface LeaveEventPayload {
  leave: Leave;
  profile: Profile;
}

@Injectable()
export class LeaveNotificationListener {
  constructor(
    private notificationService: NotificationService,
    private prismaService: PrismaService,
  ) {}

  /**
   * Listens for the 'leave.created' event
   * and notifies the manager.
   */
  @OnEvent('leave.created')
  async handleLeaveCreated(payload: LeaveEventPayload) {
    const { leave, profile } = payload;
    
    if (!leave.managerId) {
        console.error('Leave request has no managerId. Cannot send notification.');
        return;
    };

    // 1. Find the manager's Profile
    const managerProfile = await this.prismaService.profile.findUnique({
      where: { id: leave.managerId },
      select: { userId: true }, // We only need their User ID
    });

    if (!managerProfile) {
        console.error(`Manager profile with ID ${leave.managerId} not found. Cannot send notification.`);
        return;
    };

    // 2. Create the notification for the manager
    await this.notificationService.create({
      recipientId: managerProfile.userId,
      message: `${profile.fullName} of ID ${profile.id} has requested ${leave.daysRequested} days of ${leave.type} leave.`,
      linkUrl: `/app/leaves/approve/${leave.id}`, // A deep link for the manager
    });
  }

  /**
   * Listens for the 'leave.actioned' event
   * and notifies the employee.
   */
  @OnEvent('leave.actioned')
  async handleLeaveActioned(payload: LeaveEventPayload & { status: string }) {
    const { leave, profile, status } = payload;
    
    if (!profile.userId) {
        console.error(`Missing userId on profile ${profile.id}. Cannot send notification.`);
        return;
    }

    // 1. Create the notification for the employee
    await this.notificationService.create({
      recipientId: profile.userId,
      message: `Your ${leave.type} request for ${leave.startDate} was ${status}.`,
      linkUrl: `/app/leaves/my-requests/${leave.id}`,
    });
  }
}