import { OnModuleInit, UseGuards } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { WsGuard } from './guards/ws.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Message, User } from '@prisma/client';
import { MessageDto } from '../messages/dtos';
import { MessagesService } from '../messages/messages.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateNotificationDto } from '../notifications/dtos';

@WebSocketGateway({
  cors: { origin: '*' },
})
@UseGuards(WsGuard)
export class AppGateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messagesService: MessagesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    this.server.on('connection', (socket) => {
      console.log(socket.id + ' connected');
    });
  }

  @SubscribeMessage('sendMessage')
  async sendMessage(@GetUser() user: User, @MessageBody() payload: MessageDto): Promise<WsResponse<Message>> {
    const message = await this.messagesService.sendMessage(user.id, payload.boardId, payload.content);
    this.server.emit(`message-${message.boardId}`, {
      emit: `message-${payload.boardId}`,
      userId: user.id,
      sender: {
        name: user.name,
        avatar: user.avatar,
        username: user.username,
      },
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
    });

    return { event: 'sendMessage', data: message };
  }

  @SubscribeMessage('createNotification')
  async createNotification(
    @GetUser() user: User,
    @MessageBody() body: CreateNotificationDto,
  ): Promise<WsResponse<Message>> {
    const { notification } = await this.notificationsService.createNotification(user.id, body);
    this.server.emit(`notification-${notification.receiverId}`, notification);

    return { event: 'createNotification', data: notification };
  }
}
