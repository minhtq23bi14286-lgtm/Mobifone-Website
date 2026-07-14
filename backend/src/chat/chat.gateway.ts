import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from '../notifications/notifications.service';
import { Message } from './message.entity';
import { getJwtSecret } from '../auth/jwt-secret';


@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:5173',
      'https://mobifone-website.vercel.app',
    ],
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private connectedUsers = new Map<number, string>();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) { client.disconnect(); return; }
      const payload = this.jwtService.verify(token, {
        secret: getJwtSecret(),
      });
      client.data.userId = payload.sub;
      client.data.displayName = payload.displayName;
      this.connectedUsers.set(payload.sub, client.id);
      this.server.emit('userOnline', { userId: payload.sub });
    } catch { client.disconnect(); }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.connectedUsers.delete(client.data.userId);
      this.server.emit('userOffline', { userId: client.data.userId });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      receiverId: number;
      content: string;
      replyToId?: number;
      fileUrl?: string;
      fileName?: string;
      fileType?: string;
    },
  ) {
    const senderId = client.data.userId;
    const message = await this.chatService.saveMessage(
      senderId, data.receiverId, data.content,
      data.replyToId, data.fileUrl, data.fileName, data.fileType,
    );

    // Load replyTo nếu có
   let replyTo: Message | undefined = undefined;
    if (data.replyToId) {
      const messages = await this.chatService.getMessages(senderId, data.receiverId);
      replyTo = messages.find(m => m.id === data.replyToId) || undefined;
    }

    const messageData = {
      id: message.id,
      senderId,
      receiverId: data.receiverId,
      content: data.content,
      createdAt: message.createdAt,
      senderName: client.data.displayName,
      replyToId: data.replyToId,
      replyTo: replyTo,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileType: data.fileType,
      reactions: {},
      isRead: false,
    };

    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('receiveMessage', messageData);
      this.server.to(receiverSocketId).emit('newNotification', {
        type: 'message',
        title: 'Tin nhắn mới',
        content: `${client.data.displayName}: ${data.content.substring(0, 50)}`,
        referenceId: senderId,
        createdAt: new Date(),
      });
    }

    await this.notificationsService.createNotification(
      data.receiverId, 'message', 'Tin nhắn mới',
      `${client.data.displayName}: ${data.content.substring(0, 50)}`, senderId,
    );

    client.emit('messageSent', messageData);
  }

  @SubscribeMessage('getMessages')
  async handleGetMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: number },
  ) {
    const messages = await this.chatService.getMessages(client.data.userId, data.receiverId);
    client.emit('messageHistory', messages);
  }

  @SubscribeMessage('getLastMessages')
  async handleGetLastMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { contactIds: number[] },
  ) {
    const result: Record<number, any> = {};
    for (const contactId of data.contactIds) {
      const last = await this.chatService.getLastMessage(client.data.userId, contactId);
      const unread = await this.chatService.getUnreadCountFrom(contactId, client.data.userId);
      result[contactId] = { lastMessage: last, unreadCount: unread };
    }
    client.emit('lastMessages', result);
  }

  @SubscribeMessage('reactMessage')
  async handleReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: number; emoji: string; receiverId: number },
  ) {
    const updated = await this.chatService.reactToMessage(
      data.messageId, client.data.userId, data.emoji,
    );
    const reactionData = { messageId: data.messageId, reactions: updated.reactions };
    client.emit('messageReacted', reactionData);
    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('messageReacted', reactionData);
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { senderId: number },
  ) {
    await this.chatService.markAsRead(data.senderId, client.data.userId);
    // Thông báo cho sender biết tin đã đọc
    const senderSocketId = this.connectedUsers.get(data.senderId);
    if (senderSocketId) {
      this.server.to(senderSocketId).emit('messagesRead', { by: client.data.userId });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: number; isTyping: boolean },
  ) {
    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('userTyping', {
        userId: client.data.userId,
        isTyping: data.isTyping,
      });
    }
  }

  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    client.emit('onlineUsers', Array.from(this.connectedUsers.keys()));
    }
  getOnlineCount(): number {
  return this.connectedUsers.size;
}
  // Giữ nguyên các handler video call
  @SubscribeMessage('callUser')
  async handleCallUser(@ConnectedSocket() client: Socket, @MessageBody() data: { receiverId: number; signal: any }) {
    const receiverSocketId = this.connectedUsers.get(Number(data.receiverId));
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('incomingCall', {
        callerId: client.data.userId, callerName: client.data.displayName, signal: data.signal,
      });
    }
  }

  @SubscribeMessage('answerCall')
  handleAnswerCall(@ConnectedSocket() client: Socket, @MessageBody() data: { callerId: number; signal: any }) {
    const callerId = Number(data.callerId);
    const callerSocketId = this.connectedUsers.get(callerId);
    console.log(`[answerCall] callerId=${callerId}, found=${!!callerSocketId}`);
    if (callerSocketId) this.server.to(callerSocketId).emit('callAccepted', { signal: data.signal });
  }

  @SubscribeMessage('rejectCall')
  handleRejectCall(@ConnectedSocket() client: Socket, @MessageBody() data: { callerId: number }) {
    const callerSocketId = this.connectedUsers.get(Number(data.callerId));
    if (callerSocketId) this.server.to(callerSocketId).emit('callRejected', { rejectedBy: client.data.displayName });
  }

  @SubscribeMessage('endCall')
  handleEndCall(@ConnectedSocket() client: Socket, @MessageBody() data: { receiverId: number }) {
    const receiverSocketId = this.connectedUsers.get(Number(data.receiverId));
    if (receiverSocketId) this.server.to(receiverSocketId).emit('callEnded');
  }

  @SubscribeMessage('iceCandidate')
  handleIceCandidate(@ConnectedSocket() client: Socket, @MessageBody() data: { receiverId: number; candidate: any }) {
    const receiverSocketId = this.connectedUsers.get(Number(data.receiverId));
    if (receiverSocketId) this.server.to(receiverSocketId).emit('iceCandidate', { candidate: data.candidate });
  }
}