import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export type LoginStatus = 'success' | 'failed' | 'blocked';

@Entity('login_history')
export class LoginHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  userId?: number;

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
