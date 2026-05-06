import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { LoginHistory, LoginStatus } from './login-history.entity';

const MAX_FAILED_ATTEMPTS = 5;
const BLOCK_DURATION_MINUTES = 30;

@Injectable()
export class SecurityService {
  constructor(
    @InjectRepository(LoginHistory)
    private loginHistoryRepo: Repository<LoginHistory>,
  ) {}

  // Ghi lại lịch sử đăng nhập
  async logLogin(
    email: string,
    status: LoginStatus,
    ipAddress?: string,
    userAgent?: string,
    userId?: number,
    failReason?: string,
  ): Promise<void> {
    const entry = this.loginHistoryRepo.create({
      email, status, ipAddress, userAgent, userId, failReason,
    });
    await this.loginHistoryRepo.save(entry);
  }

  // Kiểm tra xem email có đang bị block không
  async isBlocked(email: string): Promise<{ blocked: boolean; remainingMinutes?: number }> {
    const blockWindow = new Date(Date.now() - BLOCK_DURATION_MINUTES * 60 * 1000);
    const recentFails = await this.loginHistoryRepo.count({
      where: { email, status: 'failed', createdAt: MoreThan(blockWindow) },
    });
    if (recentFails >= MAX_FAILED_ATTEMPTS) {
      // Tìm lần fail gần nhất
      const lastFail = await this.loginHistoryRepo.findOne({
        where: { email, status: 'failed' },
        order: { createdAt: 'DESC' },
      });
      if (lastFail) {
        const unlockTime = new Date(lastFail.createdAt.getTime() + BLOCK_DURATION_MINUTES * 60 * 1000);
        const remaining = Math.ceil((unlockTime.getTime() - Date.now()) / 60000);
        if (remaining > 0) return { blocked: true, remainingMinutes: remaining };
      }
    }
    return { blocked: false };
  }

  // Đếm số lần fail gần đây của một email
  async getFailedAttempts(email: string): Promise<number> {
    const blockWindow = new Date(Date.now() - BLOCK_DURATION_MINUTES * 60 * 1000);
    return this.loginHistoryRepo.count({
      where: { email, status: 'failed', createdAt: MoreThan(blockWindow) },
    });
  }

  // Lấy lịch sử đăng nhập (admin)
  async getLoginHistory(limit = 50): Promise<LoginHistory[]> {
    return this.loginHistoryRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // Lấy lịch sử của 1 user
  async getUserLoginHistory(userId: number): Promise<LoginHistory[]> {
    return this.loginHistoryRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  // Lấy các IP đang bị suspect (nhiều lần fail)
  async getSuspectIPs(): Promise<{ ip: string; failCount: number; lastAttempt: Date }[]> {
    const blockWindow = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 giờ
    const results = await this.loginHistoryRepo
      .createQueryBuilder('lh')
      .select('lh.ipAddress', 'ip')
      .addSelect('COUNT(*)', 'failCount')
      .addSelect('MAX(lh.createdAt)', 'lastAttempt')
      .where('lh.status = :status', { status: 'failed' })
      .andWhere('lh.createdAt > :since', { since: blockWindow })
      .andWhere('lh.ipAddress IS NOT NULL')
      .groupBy('lh.ipAddress')
      .having('COUNT(*) >= 3')
      .orderBy('failCount', 'DESC')
      .getRawMany();
    return results;
  }

  // Stats tổng quan
  async getSecurityStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalLogins, successToday, failedToday, failedWeek, suspectIPs] = await Promise.all([
      this.loginHistoryRepo.count(),
      this.loginHistoryRepo.count({ where: { status: 'success', createdAt: MoreThan(today) } }),
      this.loginHistoryRepo.count({ where: { status: 'failed', createdAt: MoreThan(today) } }),
      this.loginHistoryRepo.count({ where: { status: 'failed', createdAt: MoreThan(last7days) } }),
      this.getSuspectIPs(),
    ]);

    return {
      totalLogins,
      successToday,
      failedToday,
      failedWeek,
      suspectIPCount: suspectIPs.length,
      suspectIPs,
    };
  }

  // Xóa lịch sử cũ (giữ 90 ngày)
  async cleanOldHistory(): Promise<void> {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    await this.loginHistoryRepo.createQueryBuilder()
      .delete()
      .where('createdAt < :cutoff', { cutoff })
      .execute();
  }
}
