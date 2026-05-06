import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { ChatGateway } from '../chat/chat.gateway';

@Controller('api/admin/stats')
@UseGuards(JwtAuthGuard)
export class AdminStatsController {
  constructor(
    private usersService: UsersService,
    private chatGateway: ChatGateway,
  ) {}

  @Get()
  async getStats() {
    const allUsers = await this.usersService.findAll();
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter((u: any) => u.isActive).length;
    const onlineCount = this.chatGateway.getOnlineCount();

    return {
      totalUsers,
      activeUsers,
      onlineCount,
      // Cảnh báo bảo mật mock — thay bằng bảng thật sau
      securityAlerts: [
        { type: "warning", msg: "5 lần đăng nhập thất bại từ IP 192.168.1.105", time: "5 phút trước" },
        { type: "error",   msg: "Tài khoản nguyen.van.x@mobifone.vn bị khóa tự động", time: "12 phút trước" },
        { type: "info",    msg: `Người dùng mới đăng ký: ${activeUsers} tài khoản active`, time: "1 giờ trước" },
        { type: "success", msg: "Backup database hoàn thành lúc 02:00 AM", time: "8 giờ trước" },
      ],
    };
  }
}
