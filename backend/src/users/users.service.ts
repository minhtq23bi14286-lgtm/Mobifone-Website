import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
  return this.usersRepository.findOne({
    where: { email },
    select: ['id', 'email', 'password', 'displayName', 'role', 'department', 'isActive', 'createdAt'],
  });
}

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    return this.usersRepository.find({
      select: ['id', 'email', 'displayName', 'role', 'department', 'isActive', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  // Tạo mật khẩu ngẫu nhiên
  generatePassword(length = 12): string {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const digits = '23456789';
    const special = '!@#$%';
    const all = upper + lower + digits + special;

    let password = '';
    // Đảm bảo có đủ mỗi loại
    password += upper[Math.floor(Math.random() * upper.length)];
    password += lower[Math.floor(Math.random() * lower.length)];
    password += digits[Math.floor(Math.random() * digits.length)];
    password += special[Math.floor(Math.random() * special.length)];

    for (let i = 4; i < length; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }

    // Shuffle
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  async createUser(
    email: string,
    password: string,
    displayName: string,
    role: string = 'employee',
    department: string = 'IT Department',
  ): Promise<{ user: Omit<User, 'password'>; plainPassword: string }> {
    // Kiểm tra email đã tồn tại
    const existing = await this.findByEmail(email);
    if (existing) throw new ConflictException('Email đã tồn tại');

    const hash = await bcrypt.hash(password, 12);
    const user = this.usersRepository.create({
      email, password: hash, displayName, role, department,
    });
    const saved = await this.usersRepository.save(user);
    const { password: _, ...userWithoutPassword } = saved;
    return { user: userWithoutPassword as any, plainPassword: password };
  }

  async updateUser(
    id: number,
    data: Partial<{ displayName: string; role: string; department: string; isActive: boolean }>,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    Object.assign(user, data);
    const saved = await this.usersRepository.save(user);
    const { password: _, ...userWithoutPassword } = saved;
    return userWithoutPassword as any;
  }

  async resetPassword(id: number, newPassword?: string): Promise<{ plainPassword: string }> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const plainPassword = newPassword || this.generatePassword();
    user.password = await bcrypt.hash(plainPassword, 12);
    await this.usersRepository.save(user);
    return { plainPassword };
  }

  async deleteUser(id: number): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) return false;
    // Soft delete — set isActive = false
    user.isActive = false;
    await this.usersRepository.save(user);
    return true;
  }

  async hardDeleteUser(id: number): Promise<boolean> {
    const result = await this.usersRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async toggleActive(id: number): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    user.isActive = !user.isActive;
    const saved = await this.usersRepository.save(user);
    const { password: _, ...userWithoutPassword } = saved;
    return userWithoutPassword as any;
  }
}
