import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: { origin: '*' }, // Configure this to your HRMS domain
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService, private prisma: PrismaService) {}

  // Handle initial connection
  async handleConnection(client: Socket) {
    // Note: You can also do auth here if you want to kick users immediately
    console.log(`Client trying to connect: ${client.id}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join_rooms')
  async handleJoinRooms(@ConnectedSocket() client: any) {
    const userId = Number(client.user.id);
    
    // Find all rooms this employee belongs to
    const memberships = await this.chatService.getUserRooms(userId);
    
    // Join socket.io rooms for targeted broadcasting
    memberships.forEach((membership) => {
      client.join(membership.roomId);
    });

    return { status: 'success', joinedCount: memberships.length };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: { roomId: string; content: string; clientMessageId?: string },
    @ConnectedSocket() client: any,
  ) {
    // Fetch room to check type and permissions
    const room = await this.prisma.chatRoom.findUnique({ where: { id: data.roomId } });
    if (!room) throw new Error('Room not found');
    
    // For ANNOUNCEMENT rooms, only MANAGER or HR_ADMIN can send messages
    if (room.type === 'ANNOUNCEMENT' as any) {
      const userRole = client.user?.role;
      if (userRole !== 'MANAGER' && userRole !== 'HR_ADMIN') {
        throw new Error('Only managers and HR admins can send messages in announcement rooms');
      }
    }

    // 1. Save to DB via Service
    const newMessage = await this.chatService.saveMessage(
      Number(client.user.id),
      data.roomId,
      data.content,
    );

    const payload = {
      ...newMessage,
      clientMessageId: data.clientMessageId,
    };

    this.server.to(data.roomId).emit('new_message', payload);
    
    return newMessage; // Return to sender for "Sent" status
  }
}