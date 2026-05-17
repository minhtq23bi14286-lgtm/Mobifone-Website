import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  senderId!: number;

  @Column()
  receiverId!: number;

  @Column('text')
  content!: string;

  @Column({ default: false })
  isRead!: boolean;

  @Column({ default: false })
  isEdited!: boolean;

  @Column({ nullable: true })
  replyToId?: number;

  @ManyToOne(() => Message, { nullable: true })
  @JoinColumn({ name: 'replyToId' })
  replyTo?: Message;

  @Column({ nullable: true })
  fileUrl?: string;

  @Column({ nullable: true })
  fileName?: string;

  @Column({ nullable: true })
  fileType?: string;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  reactions?: Record<string, string>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderId' })
  sender!: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'receiverId' })
  receiver!: User;
}