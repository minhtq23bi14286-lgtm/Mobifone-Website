import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  private logger = new Logger('SeedService');

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async seed() {
  try {
    this.logger.log('Bắt đầu seed database...');

    const existingAdmin = await this.userRepo.findOne({
      where: { email: 'admin@mobifone.vn' },
    });

    if (existingAdmin) {
      this.logger.log('Admin đã tồn tại, bỏ qua seed');
      return;
    }

    const hash = await bcrypt.hash('admin123', 12);

    const admin = this.userRepo.create({
      email: 'admin@mobifone.vn',
      password: hash,
      displayName: 'Super Admin',
      role: 'admin',
      department: 'IT Department',
      isActive: true,
    });

    const employee1 = this.userRepo.create({
      email: 'quangminh@mobifone.vn',
      password: hash,
      displayName: 'Trần Quang Minh',
      role: 'employee',
      department: 'IT Department',
      isActive: true,
    });

    const employee2 = this.userRepo.create({
      email: 'employee2@mobifone.vn',
      password: hash,
      displayName: 'Nguyễn Văn B',
      role: 'employee',
      department: 'Marketing',
      isActive: true,
    });

    await this.userRepo.save([admin, employee1, employee2]);

    this.logger.log('Seed thành công!');
    this.logger.log('admin@mobifone.vn / admin123');
    this.logger.log('quangminh@mobifone.vn / admin123');
    this.logger.log('employee2@mobifone.vn / admin123');
    this.logger.log('═══════════════════════════════════════');
  } catch (error) {
  
    this.logger.error('Lỗi seed:', (error as Error).message);
    this.logger.error('Stack:', (error as Error).stack);
  }
}
}