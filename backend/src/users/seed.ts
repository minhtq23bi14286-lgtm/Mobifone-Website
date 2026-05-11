import { DataSource } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: 'postgresql://postgres.zbnizxsmgunavzblcwiq:Tranminh999!@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
  entities: [User],
  synchronize: true,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  await AppDataSource.initialize();
  console.log('✅ Kết nối Supabase thành công!');

  const userRepo = AppDataSource.getRepository(User);

  // Kiểm tra đã có chưa
  const existingAdmin = await userRepo.findOne({ where: { email: 'admin@mobifone.vn' } });
  if (existingAdmin) {
    console.log('⚠️ Admin đã tồn tại, bỏ qua...');
  } else {
    const hash = await bcrypt.hash('admin123', 12);

    const admin = userRepo.create({
      email: 'admin@mobifone.vn',
      password: hash,
      displayName: 'Super Admin',
      role: 'admin',
      department: 'IT Department',
      isActive: true,
    });

    const employee = userRepo.create({
      email: 'quangminh@mobifone.vn',
      password: hash,
      displayName: 'Trần Quang Minh',
      role: 'employee',
      department: 'IT Department',
      isActive: true,
    });

    await userRepo.save([admin, employee]);
    console.log('✅ Seed thành công!');
    console.log('📧 admin@mobifone.vn / admin123');
    console.log('📧 quangminh@mobifone.vn / admin123');
  }

  await AppDataSource.destroy();
}

seed().catch(err => {
  console.error('❌ Lỗi seed:', err);
  process.exit(1);
});