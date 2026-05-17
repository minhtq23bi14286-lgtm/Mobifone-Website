import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async saveMessage(
    senderId: number,
    receiverId: number,
    content: string,
    replyToId?: number,
    fileUrl?: string,
    fileName?: string,
    fileType?: string,
  ): Promise<Message> {
    const message = this.messageRepository.create({
      senderId, receiverId, content, replyToId,
      fileUrl, fileName, fileType, reactions: {},
    });
    return this.messageRepository.save(message);
  }

  async getMessages(userId1: number, userId2: number): Promise<Message[]> {
    return this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.replyTo', 'replyTo')
      .where(
        '(message.senderId = :userId1 AND message.receiverId = :userId2) OR (message.senderId = :userId2 AND message.receiverId = :userId1)',
        { userId1, userId2 },
      )
      .orderBy('message.createdAt', 'ASC')
      .getMany();
  }

  async markAsRead(senderId: number, receiverId: number): Promise<void> {
    await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .where('senderId = :senderId AND receiverId = :receiverId AND isRead = false', { senderId, receiverId })
      .execute();
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.messageRepository.count({ where: { receiverId: userId, isRead: false } });
  }

  async getLastMessage(userId1: number, userId2: number): Promise<Message | null> {
    return this.messageRepository
      .createQueryBuilder('message')
      .where(
        '(message.senderId = :userId1 AND message.receiverId = :userId2) OR (message.senderId = :userId2 AND message.receiverId = :userId1)',
        { userId1, userId2 },
      )
      .orderBy('message.createdAt', 'DESC')
      .getOne();
  }

  async getUnreadCountFrom(senderId: number, receiverId: number): Promise<number> {
    return this.messageRepository.count({ where: { senderId, receiverId, isRead: false } });
  }

  async reactToMessage(messageId: number, userId: number, emoji: string): Promise<Message> {
    const message = await this.messageRepository.findOneOrFail({ where: { id: messageId } });
    const reactions = message.reactions || {};
    if (reactions[userId] === emoji) { delete reactions[userId]; }
    else { reactions[userId] = emoji; }
    message.reactions = reactions;
    return this.messageRepository.save(message);
  }

  // ── Edit message ──────────────────────────────────────────────
  async editMessage(messageId: number, userId: number, newContent: string): Promise<Message | null> {
    const message = await this.messageRepository.findOne({ where: { id: messageId, senderId: userId } });
    if (!message) return null;
    message.content = newContent;
    message.isEdited = true;
    return this.messageRepository.save(message);
  }

  async deleteMessages(userId1: number, userId2: number): Promise<void> {
    await this.messageRepository
      .createQueryBuilder()
      .delete()
      .from(Message)
      .where(
        '(senderId = :userId1 AND receiverId = :userId2) OR (senderId = :userId2 AND receiverId = :userId1)',
        { userId1, userId2 },
      )
      .execute();
  }
}