import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ChatGateway } from '../chat/chat.gateway';
import { SecurityService } from '../security/security.service';
import { UsersService } from '../users/users.service';

@Controller('api/admin/stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminStatsController {
  constructor(
    private usersService: UsersService,
    private chatGateway: ChatGateway,
    private securityService: SecurityService,
  ) {}

  @Get()
  async getStats() {
    const allUsers = await this.usersService.findAll();
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter((u: any) => u.isActive).length;
    const onlineCount = this.chatGateway.getOnlineCount();
    const securityStats = await this.securityService.getSecurityStats();
    const securityAlerts = [
      ...(securityStats.failedToday > 0
        ? [{ type: 'warning', msg: `${securityStats.failedToday} failed login attempts today`, time: 'today' }]
        : []),
      ...(securityStats.failedWeek > 0
        ? [{ type: 'info', msg: `${securityStats.failedWeek} failed login attempts in the last 7 days`, time: 'last 7 days' }]
        : []),
      ...securityStats.suspectIPs.map((item: any) => ({
        type: 'error',
        msg: `Suspicious IP ${item.ip} has ${item.fail_count || item.failCount} failed login attempts`,
        time: item.last_attempt || item.lastAttempt,
      })),
    ];

    return {
      totalUsers,
      activeUsers,
      onlineCount,
      securityAlerts,
    };
  }
}
