import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { LoginHistory } from '../security/login-history.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  private logger = new Logger('SeedService');

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(LoginHistory) private loginHistoryRepo: Repository<LoginHistory>,
  ) {}

  async seed() {
    try {
      this.logger.log('Bat dau seed database...');

      // Xoa lich su dang nhap that bai de mo khoa tai khoan
      await this.loginHistoryRepo.delete({ status: 'failed' });
      await this.loginHistoryRepo.delete({ status: 'blocked' });
      this.logger.log('Da xoa lich su dang nhap that bai');

      const hash = await bcrypt.hash('admin123', 12);

      const accounts = [
        {
          email: 'admin@mobifone.vn',
          displayName: 'Super Admin',
          role: 'admin',
          department: 'IT Department',
        },
        {
          email: 'quangminh@mobifone.vn',
          displayName: 'Tran Quang Minh',
          role: 'employee',
          department: 'IT Department',
        },
        {
          email: 'employee2@mobifone.vn',
          displayName: 'Nguyen Van B',
          role: 'employee',
          department: 'Marketing',
        },
      ];

      for (const account of accounts) {
        const existing = await this.userRepo.findOne({
          where: { email: account.email },
        });

        if (existing) {
          // Cap nhat lai password va kich hoat tai khoan
          existing.password = hash;
          existing.isActive = true;
          await this.userRepo.save(existing);
          this.logger.log('Da cap nhat lai tai khoan: ' + account.email);
        } else {
          // Tao tai khoan moi
          const user = this.userRepo.create({
            ...account,
            password: hash,
            isActive: true,
          });
          await this.userRepo.save(user);
          this.logger.log('Da tao tai khoan: ' + account.email);
        }
      }

      this.logger.log('Seed hoan tat. Tat ca tai khoan dung mat khau: admin123');
    } catch (error) {
      this.logger.error('Loi seed:', (error as Error).message);
    }
  }
}