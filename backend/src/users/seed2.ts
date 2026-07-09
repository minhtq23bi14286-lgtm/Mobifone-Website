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
  console.log('Tạo user thành công!');
  await AppDataSource.destroy();
}

seed().catch(console.error);