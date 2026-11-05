import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';

@ApiTags('Messages')
@Controller('messages')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  /**
   * POST /messages
   * Send a new 1-to-1 message
   */
  @ApiOperation({ summary: 'Send a new private message between two users' })
  @ApiResponse({ status: 201, description: 'Message successfully created and broadcast via WebSocket', type: CreateMessageDto })
  @ApiResponse({ status: 400, description: 'Validation error or invalid sender/receiver' })
  @Post()
  createMessage(@Body() dto: CreateMessageDto) {
    // In a real app, dto.senderId would be from req.user.id
    return this.messageService.createMessage(dto);
  }

  /**
   * GET /messages/inbox?userId=...
   * Get all received messages
   */
  @ApiOperation({ summary: 'Retrieve all received messages for a user' })
  @ApiQuery({ name: 'userId', description: 'The User ID (typically from authenticated request)', type: 'integer' })
  @ApiResponse({ status: 200, description: 'List of received messages, ordered newest first' })
  @Get('inbox')
  getInbox(@Query('userId', ParseIntPipe) userId: number) {
    // In a real app, userId would be from req.user.id
    return this.messageService.getInbox(userId);
  }

  /**
   * GET /messages/sent?userId=...
   * Get all sent messages
   */
  @ApiOperation({ summary: 'Retrieve all sent messages from a user' })
  @ApiQuery({ name: 'userId', description: 'The User ID (typically from authenticated request)', type: 'integer' })
  @ApiResponse({ status: 200, description: 'List of sent messages, ordered newest first' })
  @Get('sent')
  getSent(@Query('userId', ParseIntPipe) userId: number) {
    // In a real app, userId would be from req.user.id
    return this.messageService.getSent(userId);
  }

  /**
   * PATCH /messages/:id/read?userId=...
   * Mark a message as read
   */
  @ApiOperation({ summary: 'Mark a message as read' })
  @ApiParam({ name: 'id', description: 'The Message ID to mark as read' })
  @ApiQuery({ name: 'userId', description: 'The User ID of the receiver verifying ownership (typically from authenticated request)', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Message successfully marked as read' })
  @ApiResponse({ status: 403, description: 'Forbidden: User does not own this message' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @Patch(':id/read')
  markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    // In a real app, userId would be from req.user.id
    return this.messageService.markAsRead(id, userId);
  }
}