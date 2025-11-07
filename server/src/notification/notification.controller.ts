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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { MarkReadDto } from './dto/mark-read.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../src/auth/decorators/current-user.decorator';
import { NotificationDto } from './dto/notification.dto';

type User = { id: number }; 

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
  @ApiTags('Notifications')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all notifications for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Returns a list of notifications.', type: [NotificationDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getMyNotifications(@CurrentUser() user: User) {
    // In a real app, you'd get the user ID from the auth token
    // const userId = req.user.id;
    return this.notificationService.getForUser(user.id);
  }
 
  /**
   * GET /notifications/unread-count
   * Gets a simple count of unread notifications.
   */
  @Get('unread-count')
  @ApiTags('Notifications')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the count of unread notifications for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Returns the unread notification count.', schema: { example: { count: 5 } } })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getMyUnreadCount(@CurrentUser() user: User) {
    return this.notificationService.getUnreadCount(user.id);
  }
 
  /**
   * PATCH /notifications/read
   * Marks specific notifications as read.
   */
  @Patch('read')
  @ApiTags('Notifications')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark specific notifications as read' })
  @ApiBody({ type: MarkReadDto, description: 'Array of notification IDs to mark as read' })
  @ApiResponse({ status: 200, description: 'Notifications successfully marked as read.' })
  @ApiResponse({ status: 400, description: 'Bad Request. Invalid notification IDs or request body.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  markAsRead(@Body() dto: MarkReadDto, @CurrentUser() user: User) {
    return this.notificationService.markAsRead(user.id, dto.notificationIds);
  }
 
  /**
   * POST /notifications/read-all
   * Marks all of the user's unread notifications as read.
   */
  @Post('read-all')
  @ApiTags('Notifications')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all unread notifications for the authenticated user as read' })
  @ApiResponse({ status: 200, description: 'All unread notifications successfully marked as read.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  markAllAsRead(@CurrentUser() user: User) {
    return this.notificationService.markAllAsRead(user.id);
  }
}