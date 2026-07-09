import { DataSource } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,  
  database: process.env.DB_DATABASE || 'mobifone_db',
  entities: [User],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('Kết nối PostgreSQL local thành công!');

  const userRepo = AppDataSource.getRepository(User);
  const hash = await bcrypt.hash('admin123', 12);

  // Admin
  const existingAdmin = await userRepo.findOne({ where: { email: 'admin@mobifone.vn' } });
  if (!existingAdmin) {
    await userRepo.save(userRepo.create({
      email: 'admin@mobifone.vn',
      password: hash,
      displayName: 'Super Admin',
      role: 'admin',
      department: 'IT Department',
      isActive: true,
    }));
    console.log('admin@mobifone.vn / admin123');
  } else {
    console.log('Admin đã tồn tại');
  }

  // Employee 1
  const existingEmp1 = await userRepo.findOne({ where: { email: 'quangminh@mobifone.vn' } });
  if (!existingEmp1) {
    await userRepo.save(userRepo.create({
      email: 'quangminh@mobifone.vn',
      password: hash,
      displayName: 'Trần Quang Minh',
      role: 'employee',
      department: 'IT Department',
      isActive: true,
    }));
    console.log('quangminh@mobifone.vn / admin123');
  } else {
    console.log('Employee 1 đã tồn tại');
  }

  // Employee 2
  const existingEmp2 = await userRepo.findOne({ where: { email: 'employee2@mobifone.vn' } });
  if (!existingEmp2) {
    await userRepo.save(userRepo.create({
      email: 'employee2@mobifone.vn',
      password: hash,
      displayName: 'Nguyễn Văn B',
      role: 'employee',
      department: 'Marketing',
      isActive: true,
    }));
    console.log('employee2@mobifone.vn / admin123');
  } else {
    console.log('Employee 2 đã tồn tại');
  }

  await AppDataSource.destroy();
  console.log('Seed hoàn tất!');
}

seed().catch(err => {
  console.error('Lỗi seed:', err);
  process.exit(1);
});