import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SOCKET_EVENTS } from '@walkme/shared';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage(SOCKET_EVENTS.JOIN_WALK_ROOM)
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { walkId: string },
  ) {
    client.join(`walk:${data.walkId}`);
    client.emit('joined', { walkId: data.walkId });
  }

  @SubscribeMessage(SOCKET_EVENTS.LEAVE_WALK_ROOM)
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { walkId: string },
  ) {
    client.leave(`walk:${data.walkId}`);
  }

  @SubscribeMessage(SOCKET_EVENTS.SEND_MESSAGE)
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      walkId: string;
      senderId: string;
      content: string;
      type?: 'text' | 'image' | 'location';
      imageUrl?: string;
      location?: { latitude: number; longitude: number };
    },
  ) {
    const message = await this.chatService.saveMessage(data);
    this.server.to(`walk:${data.walkId}`).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, message);
  }

  @SubscribeMessage(SOCKET_EVENTS.UPDATE_LOCATION)
  handleLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { walkId: string; userId: string; latitude: number; longitude: number },
  ) {
    client.to(`walk:${data.walkId}`).emit(SOCKET_EVENTS.WALK_LOCATION_UPDATE, data);
  }

  emitWalkStarted(walkId: string) {
    this.server.to(`walk:${walkId}`).emit(SOCKET_EVENTS.WALK_STARTED, { walkId });
  }

  emitWalkEnded(walkId: string) {
    this.server.to(`walk:${walkId}`).emit(SOCKET_EVENTS.WALK_ENDED, { walkId });
  }
}
