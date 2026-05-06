import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  type!: string; // 'message' | 'call' | 'post' | 'user_online'

  @Column()
  title!: string;

  @Column()
  content!: string;

  @Column({ default: false })
  isRead!: boolean;

  @Column({ nullable: true })
  referenceId!: number;

  @CreateDateColumn()
  createdAt!: Date;
}