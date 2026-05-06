import { DataSource } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'Tranminh999!@#',
  database: 'mobifone_db',
  entities: [User],
  synchronize: false,
});

async function seed() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);
  const hash = await bcrypt.hash('admin123', 12);

  const user = userRepo.create({
    email: 'employee2@mobifone.vn',
    password: hash,
    displayName: 'Nguyễn Văn B',
    role: 'employee',
    department: 'Marketing',
  });

  await userRepo.save(user);
  console.log('✅ Tạo user thành công!');
  await AppDataSource.destroy();
}

seed().catch(console.error);