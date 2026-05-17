import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  postId!: number;

  @Column()
  userId!: number;

  @Column('text')
  content!: string;

  @Column({ nullable: true })
  authorName?: string;

  @CreateDateColumn()
  createdAt!: Date;
}