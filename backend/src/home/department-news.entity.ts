import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('department_news')
export class DepartmentNews {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column('text')
  summary!: string;

  @Column()
  department!: string; // IT, HR, Kinh doanh, Marketing...

  @Column({ default: 'bg-blue-100 text-blue-700' })
  deptColor!: string;

  @Column({ default: 'from-blue-400 to-indigo-500' })
  gradient!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  createdBy?: number;

  @CreateDateColumn()
  createdAt!: Date;
}