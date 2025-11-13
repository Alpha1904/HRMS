import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { Message } from '@prisma/client';

// A type for our message payload from the service
type MessageWithSender = Message & {
  sender: {
    profile: {
      fullName: string | null;
      avatarUrl: string | null;
    };
  };
};

@WebSocketGateway({
  cors: {
    origin: '*', // Allow all origins for testing
  },
})
export class MessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  // A map to store connected users: Map<userId, socketId>
  private connectedUsers: Map<number, string> = new Map();

  /**
   * Handles a client (user) connecting to the server.
   * We don't know *who* they are yet, just that a connection is made.
   */
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  /**
   * Handles a client disconnecting.
   * We must clean up our map to remove the user.
   */
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Find the user ID for the disconnected socket and remove them
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        break;
      }
    }
  }

  /**
   * ### Client-to-Server Event: "register"
   * After a client connects, they MUST send this event
   * with their `userId` to be registered for notifications.
   */
  @SubscribeMessage('register')
  handleRegister(
    @MessageBody() userId: number,
    @ConnectedSocket() client: Socket,
  ) {
    if (typeof userId === 'number') {
      this.connectedUsers.set(userId, client.id);
      console.log(`User ${userId} registered with socket ${client.id}`);
    }
  }

  /**
   * ### Service-to-Gateway Event: "message.created"
   * Listens for the event emitted by MessageService.
   * This is the "push" part of the real-time system.
   */
  @OnEvent('message.created')
  handleMessageCreated(payload: { message: MessageWithSender }) {
    const { message } = payload;
    const receiverId = message.receiverId;

    // Find the socket ID of the receiver
    const receiverSocketId = this.connectedUsers.get(receiverId);

    if (receiverSocketId) {
      // Send the new message to the specific receiver
      this.server
        .to(receiverSocketId)
        .emit('newMessage', message);
    }
  }

  
}