import {
  Controller,
  Get,
  Patch,
  Body,
  UsePipes,
  ValidationPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { MarkReadDto } from './dto/mark-read.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

// @UseGuards(JwtAuthGuard)
@UseGuards(JwtAuthGuard)
@Controller('notifications')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * GET /notifications
   * Gets all notifications for the *authenticated* user.
   */
  @Get()
  getMyNotifications(@CurrentUser() user:any) {
    // In a real app, you'd get the user ID from the auth token
    // const userId = req.user.id;
    return this.notificationService.getForUser(user.id);
  }
  
  /**
   * GET /notifications/unread-count
   * Gets a simple count of unread notifications.
   */
  @Get('unread-count')
  getMyUnreadCount(@CurrentUser() user:any) {
    return this.notificationService.getUnreadCount(user.id);
  }

  /**
   * PATCH /notifications/read
   * Marks specific notifications as read.
   */
  @Patch('read')
  markAsRead(@Body() dto: MarkReadDto, @CurrentUser() user:any) {
    return this.notificationService.markAsRead(user.id, dto.notificationIds);
  }

  /**
   * POST /notifications/read-all
   * Marks all of the user's unread notifications as read.
   */
  @Post('read-all')
  markAllAsRead(@CurrentUser() user:any) {
    return this.notificationService.markAllAsRead(user.id);
  }
}