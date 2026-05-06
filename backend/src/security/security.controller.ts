import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { SecurityService } from './security.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/security')
@UseGuards(JwtAuthGuard)
export class SecurityController {
  constructor(private securityService: SecurityService) {}

  // Lấy stats tổng quan
  @Get('stats')
  async getStats() {
    return this.securityService.getSecurityStats();
  }

  // Lấy lịch sử đăng nhập
  @Get('history')
  async getHistory(@Query('limit') limit?: string) {
    return this.securityService.getLoginHistory(limit ? parseInt(limit) : 50);
  }

  // Lấy lịch sử của 1 user
  @Get('history/user/:userId')
  async getUserHistory(@Param('userId') userId: string) {
    return this.securityService.getUserLoginHistory(Number(userId));
  }

  // Lấy danh sách IP suspect
  @Get('suspect-ips')
  async getSuspectIPs() {
    return this.securityService.getSuspectIPs();
  }
}
