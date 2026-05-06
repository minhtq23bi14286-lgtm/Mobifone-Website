import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type PostStatus = 'pending' | 'approved' | 'rejected';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  title!: string;

  @Column('text')
  content!: string;

  @Column({ nullable: true })
  category!: string;

  @Column('simple-array', { nullable: true })
  attachments!: string[];

  @Column({ default: 0 })
  likes!: number;

  @Column({ default: 0 })
  comments!: number;

  @Column({ default: 0 })
  views!: number;

  // ── Kiểm duyệt ──────────────────────────────────────────────
  @Column({ type: 'varchar', default: 'pending' })
  status!: PostStatus;

  @Column({ nullable: true, type: 'text' })
  rejectReason?: string;       // Lý do từ chối

  @Column({ nullable: true })
  reviewedBy?: number;         // Admin đã duyệt

  @Column({ nullable: true })
  reviewedAt?: Date;           // Thời điểm duyệt
  // ─────────────────────────────────────────────────────────────

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}