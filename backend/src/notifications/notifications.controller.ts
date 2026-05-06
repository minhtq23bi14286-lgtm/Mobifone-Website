import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getNotifications(@Request() req: any) {
    const notifications = await this.notificationsService.getNotifications(req.user.sub);
    const unreadCount = await this.notificationsService.getUnreadCount(req.user.sub);
    return { notifications, unreadCount };
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(@Param('id') id: string) {
    await this.notificationsService.markAsRead(Number(id));
    return { success: true };
  }

  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  async markAllAsRead(@Request() req: any) {
    await this.notificationsService.markAllAsRead(req.user.sub);
    return { success: true };
  }
}