import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ type: 'date' })
  date!: string;

  @Column()
  time!: string;

  @Column()
  location!: string;

  @Column({ default: 'Sự kiện' }) // Họp, Deadline, Đào tạo, Sự kiện
  typeLabel!: string;

  @Column({ default: 'from-[#1F4E79] to-[#2E75B6]' })
  color!: string;

  @Column({ default: 'bg-blue-100 text-blue-700' })
  tagColor!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  createdBy?: number;

  @CreateDateColumn()
  createdAt!: Date;
}