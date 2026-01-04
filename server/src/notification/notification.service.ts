import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Prisma } from '@prisma/client';
import { createTransport, SendMailOptions, Transporter } from 'nodemailer';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class NotificationService {
  private prisma: PrismaService;
  private mailTransport: Transporter;
  private readonly logger = new Logger(NotificationService.name);
  constructor(private configService: ConfigService) {
    this.mailTransport = createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: Number(this.configService.get('SMTP_PORT')),
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async createInternal(userId: number, message: string): Promise<void> {
    await this.prisma.notification.create({
      data: {
        recipientId: userId,
        message,
      },
    });
    this.logger.log(`Internal notification created for user ${userId}`);
  }

  async sendEmail(to: string, subject: string, body: string, from?: string): Promise<void> {
    try {
      await this.mailTransport.sendMail({
        from: from || this.configService.get('SENDER_EMAIL'),
        to,
        subject,
        html: body,
      });
      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
    }
  }


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