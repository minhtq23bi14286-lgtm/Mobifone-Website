import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

export type LoginStatus = 'success' | 'failed' | 'blocked';

@Entity('login_history')
export class LoginHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  userId?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column()
  email!: string;

  @Column({ type: 'varchar' })
  status!: LoginStatus;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @Column({ nullable: true })
  failReason?: string;

  @CreateDateColumn()
  createdAt!: Date;
}