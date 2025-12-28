import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateDirectMessageDto } from './dto/create-dm.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

@Controller('chat')
@UseGuards(JwtAuthGuard) // Protects all endpoints below
@ApiTags('Chat')
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * 1. Get All Rooms for the Current User (Sidebar)
   * GET /chat/rooms
   */
  @Get('rooms')
  @ApiOperation({ summary: 'Get all chat rooms for the current user' })
  @ApiOkResponse({ description: 'List of chat rooms' })
  async getMyRooms(@Request() req) {
    // req.user.id comes from the JWT payload attached by the Guard
    return this.chatService.getMyRooms(req.user.id);
  }

  /**
   * 2. Get Message History for a specific Room
   * GET /chat/rooms/:roomId/messages?limit=50&cursor=msg-uuid
   */
  @Get('rooms/:roomId/messages')
  @ApiOperation({ summary: 'Get message history for a room' })
  @ApiParam({ name: 'roomId', required: true, description: 'ID of chat room' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of messages to return',
    example: 50,
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: String,
    description: 'Cursor for pagination',
  })
  @ApiOkResponse({ description: 'Paginated list of messages' })
  async getRoomMessages(
    @CurrentUser() user: any,
    @Param('roomId') roomId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 50,
    @Query('cursor') cursor?: string,
  ) {
    try {
      const messages = await this.chatService.getRoomMessages(
        user.id,
        roomId,
        limit,
        cursor,
      );

      // Return structure optimized for infinite scroll
      return {
        data: messages,
        nextCursor:
          messages.length === limit ? messages[messages.length - 1].id : null,
      };
    } catch (err) {
      // If user not a member, return 403
      if (err?.message === 'You are not a member of this chat room') {
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }
      console.error('Error fetching room messages', err);
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 3. Initiate or Find a Direct Message (1:1)
   * POST /chat/dm
   * Body: { targetUserId: "uuid..." }
   */
  @Post('dm')
  @ApiOperation({ summary: 'Get or create a direct chat (1:1)' })
  @ApiBody({ type: CreateDirectMessageDto })
  @ApiBadRequestResponse({
    description: 'Invalid target user or cannot chat with self',
  })
  @ApiOkResponse({ description: 'Returns chat room info' })
  async getOrCreateDirectChat(
    @CurrentUser() user: any,
    @Body() createDmDto: CreateDirectMessageDto,
  ) {
    if (user.id === createDmDto.targetUserId) {
      throw new HttpException(
        'You cannot chat with yourself',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.chatService.getOrCreateDirectChat(
        user.id,
        createDmDto.targetUserId,
      );
    } catch (err) {
      if (err?.message?.includes('Profile not found')) {
        throw new HttpException('Target user profile not found', HttpStatus.BAD_REQUEST);
      }
      console.error('Error creating/fetching direct chat', err);
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 4. Send a Message via REST (Fallback/File Upload preparation)
   * POST /chat/rooms/:roomId/messages
   * Body: { content: "Hello world" }
   * * Note: Usually, text messages go through WebSocket.
   * We keep this for external integrations or file attachment flows.
   */
  @Post('rooms/:roomId/messages')
  @ApiOperation({ summary: 'Send a message to a room' })
  @ApiParam({ name: 'roomId', required: true, description: 'ID of chat room' })
  @ApiBody({ type: SendMessageDto })
  @ApiOkResponse({ description: 'Message created and returned' })
  async saveMessage(
    @CurrentUser() user: any,
    @Param('roomId') roomId: string,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    try {
      return await this.chatService.saveMessage(
        user.id,
        roomId,
        sendMessageDto.content,
      );
    } catch (err) {
      if (err?.message === 'Not authorized to post in this room') {
        throw new HttpException(err.message, HttpStatus.FORBIDDEN);
      }
      console.error('Error saving message', err);
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('users')
  async searchUsers(@CurrentUser() user: any, @Query('q') query: string = '') {
    return this.chatService.searchUsers(query, user.id);
  }

  /**
   * 5. Create a Group Chat (MANAGER only)
   * POST /chat/groups
   * Body: { name: string, memberUserIds: number[] }
   */
  @Post('groups')
  @ApiOperation({ summary: 'Create a group chat (manager only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Project Alpha' },
        memberUserIds: { type: 'array', items: { type: 'number' }, example: [2, 3, 4] }
      },
      required: ['name', 'memberUserIds']
    }
  })
  @ApiOkResponse({ description: 'Group chat created and returned' })
  @ApiBadRequestResponse({ description: 'Invalid input or not a manager' })
  async createGroup(
    @CurrentUser() user: any,
    @Body() body: { name: string; memberUserIds: number[] },
  ) {
    // Restrict to MANAGER role
    if (user.role !== 'MANAGER') {
      throw new HttpException('Only managers can create groups', HttpStatus.FORBIDDEN);
    }
    if (!body.name?.trim()) {
      throw new HttpException('Group name is required', HttpStatus.BAD_REQUEST);
    }
    if (!Array.isArray(body.memberUserIds) || body.memberUserIds.length < 2) {
      throw new HttpException('At least two members are required (including yourself)', HttpStatus.BAD_REQUEST);
    }
    // Ensure creator is included
    if (!body.memberUserIds.includes(user.id)) {
      body.memberUserIds.unshift(user.id);
    }
    try {
      return await this.chatService.createGroupRoom(body.name.trim(), body.memberUserIds);
    } catch (err) {
      console.error('Error creating group', err);
      throw new HttpException('Failed to create group', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 6. Create an Announcement Chat (MANAGER or HR_ADMIN only)
   * POST /chat/announcements
   * Body: { name: string, memberUserIds: number[] }
   */
  @Post('rooms/:roomId/members')
  @UseGuards(JwtAuthGuard)
  async addMembersToRoom(
    @Request() req: any,
    @Param('roomId') roomId: string,
    @Body() body: { memberUserIds: number[] }
  ) {
    try {
      // Verify user is MANAGER or HR_ADMIN (or room admin)
      const userRole = req.user?.role;
      if (!['MANAGER', 'HR_ADMIN'].includes(userRole)) {
        throw new HttpException('Only managers and HR admins can add members', HttpStatus.FORBIDDEN);
      }

      if (!body.memberUserIds || body.memberUserIds.length === 0) {
        throw new HttpException('Member user IDs are required', HttpStatus.BAD_REQUEST);
      }

      const updatedRoom = await this.chatService.addMembersToRoom(roomId, body.memberUserIds);
      return updatedRoom;
    } catch (error) {
      console.error('Error adding members to room:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to add members to room', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete('rooms/:roomId/members')
  @UseGuards(JwtAuthGuard)
  async removeMembersFromRoom(
    @Request() req: any,
    @Param('roomId') roomId: string,
    @Body() body: { memberUserIds: number[] }
  ) {
    try {
      // Verify user is MANAGER or HR_ADMIN (or room admin)
      const userRole = req.user?.role;
      if (!['MANAGER', 'HR_ADMIN'].includes(userRole)) {
        throw new HttpException('Only managers and HR admins can remove members', HttpStatus.FORBIDDEN);
      }

      if (!body.memberUserIds || body.memberUserIds.length === 0) {
        throw new HttpException('Member user IDs are required', HttpStatus.BAD_REQUEST);
      }

      const updatedRoom = await this.chatService.removeMembersFromRoom(roomId, body.memberUserIds);
      return updatedRoom;
    } catch (error) {
      console.error('Error removing members from room:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to remove members from room', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('announcements')
  @ApiOperation({ summary: 'Create an announcement chat (manager or hr admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Company Updates' },
        memberUserIds: { type: 'array', items: { type: 'number' }, example: [2, 3, 4] }
      },
      required: ['name', 'memberUserIds']
    }
  })
  @ApiOkResponse({ description: 'Announcement chat created and returned' })
  @ApiBadRequestResponse({ description: 'Invalid input or not a manager/hr admin' })
  async createAnnouncement(
    @CurrentUser() user: any,
    @Body() body: { name: string; memberUserIds: number[] },
  ) {
    // Restrict to MANAGER or HR_ADMIN role
    if (user.role !== 'MANAGER' && user.role !== 'HR_ADMIN') {
      throw new HttpException('Only managers and HR admins can create announcements', HttpStatus.FORBIDDEN);
    }
    if (!body.name?.trim()) {
      throw new HttpException('Announcement name is required', HttpStatus.BAD_REQUEST);
    }
    if (!Array.isArray(body.memberUserIds) || body.memberUserIds.length < 1) {
      throw new HttpException('At least one member is required', HttpStatus.BAD_REQUEST);
    }
    // Ensure creator is included
    if (!body.memberUserIds.includes(user.id)) {
      body.memberUserIds.unshift(user.id);
    }
    try {
      return await this.chatService.createAnnouncementRoom(body.name.trim(), body.memberUserIds);
    } catch (err) {
      console.error('Error creating announcement', err);
      throw new HttpException('Failed to create announcement', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
