import { DataSource } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'Tranminh999!@#', // thay password của bạn
  database: 'mobifone_db',
  entities: [User],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const hash = await bcrypt.hash('admin123', 12);

  // Tạo admin
  const admin = userRepo.create({
    email: 'admin@mobifone.vn',
    password: hash,
    displayName: 'Super Admin',
    role: 'admin',
    department: 'IT Department',
  });

  // Tạo employee
  const employee = userRepo.create({
    email: 'quangminh@mobifone.vn',
    password: hash,
    displayName: 'Trần Quang Minh',
    role: 'employee',
    department: 'IT Department',
  });

  await userRepo.save([admin, employee]);
  console.log('✅ Seed thành công!');
  await AppDataSource.destroy();
}

seed().catch(console.error);