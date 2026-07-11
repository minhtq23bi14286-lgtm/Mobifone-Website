import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SecurityService } from '../security/security.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private securityService: SecurityService,
  ) {}

  async login(email: string, password: string, ipAddress?: string, userAgent?: string) {
    // Kiểm tra block trước
    const { blocked, remainingMinutes } = await this.securityService.isBlocked(email);
    if (blocked) {
      await this.securityService.logLogin(email, 'blocked', ipAddress, userAgent, undefined, `Tài khoản bị tạm khóa`);
      throw new UnauthorizedException(
        `Tài khoản bị tạm khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${remainingMinutes} phút.`
      );
    }

    // Tìm user
       const user = await this.usersService.findByEmail(email);
    if (!user) {
      await this.securityService.logLogin(email, 'failed', ipAddress, userAgent, undefined, 'Email không tồn tại');
      throw new UnauthorizedException('Không tìm thấy tài khoản với email này!');
    }
    console.log('DEBUG user:', user.email, '| isActive =', user.isActive, '| type:', typeof user.isActive);

    // Kiểm tra tài khoản có active không
    if (!user.isActive) {
      await this.securityService.logLogin(email, 'failed', ipAddress, userAgent, user.id, 'Tài khoản bị vô hiệu hóa');
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.');
    }
    console.log('DEBUG password check:', 
  '| input password:', JSON.stringify(password), 
  '| hash exists:', !!user.password,
  '| hash:', user.password?.substring(0, 20));
    // Kiểm tra password
    const isPasswordValid = await this.usersService.validatePassword(password, user.password);
    if (!isPasswordValid) {
      await this.securityService.logLogin(email, 'failed', ipAddress, userAgent, user.id, 'Sai mật khẩu');
      const fails = await this.securityService.getFailedAttempts(email);
      const remaining = 5 - fails;
      throw new UnauthorizedException(
        remaining > 0
          ? `Email hoặc mật khẩu không đúng! Còn ${remaining} lần thử.`
          : 'Tài khoản sẽ bị tạm khóa sau lần thử tiếp theo!'
      );
    }

    // Đăng nhập thành công
    await this.securityService.logLogin(email, 'success', ipAddress, userAgent, user.id);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        department: user.department,
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User không tồn tại!');
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      department: user.department,
    };
  }
}
