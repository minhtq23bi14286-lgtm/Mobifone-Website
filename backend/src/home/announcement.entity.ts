import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('announcements')
export class Announcement {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column('text')
  description!: string;

  @Column({ default: 'bell' }) // icon type: bell, megaphone, clock, zap
  icon!: string;

  @Column({ default: 'from-blue-500 to-[#1F4E79]' })
  color!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  createdBy?: number;

  @CreateDateColumn()
  createdAt!: Date;
}