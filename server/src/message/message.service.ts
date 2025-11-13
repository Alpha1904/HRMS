import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Prisma, Role } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class MessageService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * ### Feature: Send Message
   * Creates a new 1-to-1 message, but only if allowed.
   */
  async createMessage(dto: CreateMessageDto) {
    const { senderId, receiverId, content, subject } = dto;

    // 1. Validate sender and receiver
    const [sender, receiver] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: senderId },
        include: { profile: true },
      }),
      this.prisma.user.findUnique({
        where: { id: receiverId },
        include: { profile: true },
      }),
    ]);

    if (!sender || !receiver) {
      throw new NotFoundException('Sender or receiver not found.');
    }

    // 2. ### Business Logic: "Limited Messaging"
    // An employee can only message their manager or an HR_ADMIN.
    // Managers and Admins can message anyone (we'll assume for now).
    if (sender.role === Role.EMPLOYEE) {
      const isReceiverManager =
        sender.profile?.managerId === receiver.profile?.id;
      const isReceiverHr = receiver.role === Role.HR_ADMIN;

      if (!isReceiverManager && !isReceiverHr) {
        throw new ForbiddenException(
          'You can only send messages to your manager or HR.',
        );
      }
    }

    // 3. Create the message
    const newMessage = await this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        subject,
      },
      include: {
        sender: {
          select: { profile: { select: { fullName: true, avatarUrl: true } } },
        },
      },
    });

    // 4. Emit event (for notifications, etc.)
    this.eventEmitter.emit('message.created', {
      message: newMessage,
    });
    return newMessage;
  }

  /**
   * ### Feature: Get Inbox
   * Gets all messages received by a user.
   */
  async getInbox(userId: number) {
    return this.prisma.message.findMany({
      where: { receiverId: userId },
      include: {
        sender: {
          select: { email: true, profile: { select: { fullName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * ### Feature: Get Sent Messages
   * Gets all messages sent by a user.
   */
  async getSent(userId: number) {
    return this.prisma.message.findMany({
      where: { senderId: userId },
      include: {
        receiver: {
          select: { email: true, profile: { select: { fullName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * ### Feature: Mark as Read
   * Marks a specific message as read.
   */
  async markAsRead(messageId: number, userId: number) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found.');
    }
    if (message.receiverId !== userId) {
      throw new ForbiddenException(
        'You can only mark your own messages as read.',
      );
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    });
  }
}
