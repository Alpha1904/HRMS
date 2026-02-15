import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  /**
   * ### Internal Method: Create Notification
   * This is called by other services (e.g., LeaveService)
   * to create a notification for a user.
   */
  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        recipientId: dto.recipientId,
        message: dto.message,
        linkUrl: dto.linkUrl,
      },
    });
  }

  /**
   * ### API Method: Get Notifications for a User
   * Gets all notifications (read and unread) for a specific User ID.
   * This User ID would come from the authenticated req.user object.
   */
  async getForUser(userId: number) {
    return this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Prevents fetching thousands of old notifications
    });
  }

  /**
   * ### API Method: Mark Notifications as Read
   * Marks one or more specific notifications as read.
   */
  async markAsRead(userId: number, notificationIds: number[]) {
    return this.prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        recipientId: userId, // Security: Can only mark your own
      },
      data: { isRead: true },
    });
  }

  /**
   * ### API Method: Mark ALL as Read
   * Marks all unread notifications for a user as read.
   */
  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: {
        recipientId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }
  
  /**
   * ### API Method: Get Unread Count
   * A lightweight query perfect for a (1) badge on a bell icon.
   */
  async getUnreadCount(userId: number): Promise<{ count: number }> {
     const count = await this.prisma.notification.count({
        where: {
            recipientId: userId,
            isRead: false,
        }
     });
     return { count };
  }
}