import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Shift, ShiftChangeRequest } from '@prisma/client';
import { NotificationService } from '../notification.service';
import { PrismaService } from '../../prisma/prisma.service';

// Type alias for clarity on the event payload
type ShiftRequestWithDetails = ShiftChangeRequest & {
  requester: { fullName: string; userId: number; managerId: number };
  shift?: Shift; // Make shift optional as it might not be included
};

@Injectable()
export class ShiftNotificationListener {
  constructor(
    private notificationService: NotificationService,
    private prisma: PrismaService, // Inject PrismaService
  ) {}

  /**
   * Listens for the 'shift.request.created' event.
   * Notifies the manager when an employee submits a request.
   */
  @OnEvent('shift.request.created')
  async handleShiftRequestCreated(payload: {
    request: ShiftRequestWithDetails;
    managerUserId: number; // Injected from the service logic
  }) {
    const { request, managerUserId } = payload;
    
    // Fetch the shift details since they are not guaranteed in the payload
    const shift = await this.prisma.shift.findUnique({
      where: { id: request.shiftId },
    });

    // Safety checks
    if (!managerUserId || !shift) {
      console.error(`ShiftNotificationListener: Missing managerUserId or shift not found for shiftId: ${request.shiftId}`);
      return;
    }

    // Format the date for the notification message
    const shiftDate = shift.date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    await this.notificationService.create({
      recipientId: managerUserId,
      message: `${request.requester.fullName} has submitted a shift change request for ${shiftDate}.`,
      linkUrl: `/app/shifts/requests/${request.id}`, // Link manager to the approval page
    });
  }

  /**
   * Listens for the 'shift.request.actioned' event.
   * Notifies the employee after their request has been APPROVED or REJECTED.
   */
  @OnEvent('shift.request.actioned')
  async handleShiftRequestActioned(payload: {
    request: ShiftChangeRequest;
    requesterUserId: number;
  }) {
    const { request, requesterUserId } = payload;
    
    // Safety check
    if (!requesterUserId) return;

    await this.notificationService.create({
      recipientId: requesterUserId,
      message: `Your shift change request was **${request.status}**.`,
      linkUrl: `/app/shifts/my-requests/${request.id}`, // Link employee to the request status
    });
  }
}