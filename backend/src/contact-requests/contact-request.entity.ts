import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type RequestType = 'feedback' | 'help' | 'report' | 'other';
export type Priority = 'low' | 'medium' | 'high';
export type RequestStatus = 'pending' | 'reviewing' | 'resolved' | 'closed';

@Entity('contact_requests')
export class ContactRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  userName!: string;

  @Column()
  userEmail!: string;

  @Column({ type: 'varchar' })
  type!: RequestType;

  @Column()
  subject!: string;

  @Column({ type: 'varchar', default: 'medium' })
  priority!: Priority;

  @Column('text')
  content!: string;

  @Column({ type: 'varchar', default: 'pending' })
  status!: RequestStatus;

  @Column({ nullable: true, type: 'text' })
  adminReply?: string;

  @Column({ nullable: true })
  repliedAt?: Date;

  @Column({ nullable: true })
  repliedBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
