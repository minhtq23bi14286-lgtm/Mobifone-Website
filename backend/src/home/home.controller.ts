import { Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { HomeService } from './home.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatGateway } from '../chat/chat.gateway';
import { UsersService } from '../users/users.service';

@Controller('api/home')
export class HomeController {
  constructor(
    private homeService: HomeService,
    private notificationsService: NotificationsService,
    private chatGateway: ChatGateway,
    private usersService: UsersService,
  ) {}

  // Helper: broadcast notification to all users
  private async broadcastNotification(type: string, title: string, content: string, referenceId?: number) {
    const users = await this.usersService.findAll();
    for (const user of users) {
      await this.notificationsService.createNotification(
        user.id, type, title, content, referenceId,
      );
    }
    // Emit real-time to all connected clients
    this.chatGateway.server.emit('newNotification', {
      type, title, content, referenceId, createdAt: new Date(),
      broadcast: true, // flag to tell frontend this is for everyone
    });
  }

  // ── Announcements ─────────────────────────────────────────────
  @Get('announcements')
  @UseGuards(JwtAuthGuard)
  getAnnouncements() { return this.homeService.getAnnouncements(); }

  @Post('announcements')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async createAnnouncement(@Request() req: any, @Body() body: any) {
    const announcement = await this.homeService.createAnnouncement({ ...body, createdBy: req.user.sub });

    // 🔔 Notification: thông báo tất cả nhân viên có thông báo mới
    await this.broadcastNotification(
      'announcement', 'Thông báo mới',
      `📢 ${body.title}`, announcement.id,
    );

    return announcement;
  }

  @Patch('announcements/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateAnnouncement(@Param('id') id: string, @Body() body: any) {
    return this.homeService.updateAnnouncement(Number(id), body);
  }

  @Delete('announcements/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  deleteAnnouncement(@Param('id') id: string) {
    return this.homeService.deleteAnnouncement(Number(id));
  }

  // ── Events ────────────────────────────────────────────────────
  @Get('events')
  @UseGuards(JwtAuthGuard)
  getEvents() { return this.homeService.getEvents(); }

  @Post('events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async createEvent(@Request() req: any, @Body() body: any) {
    const event = await this.homeService.createEvent({ ...body, createdBy: req.user.sub });

    // 🔔 Notification: thông báo tất cả nhân viên có sự kiện mới
    await this.broadcastNotification(
      'event', 'Sự kiện mới',
      `📅 ${body.title}${body.date ? ` — ${new Date(body.date).toLocaleDateString('vi-VN')}` : ''}`,
      event.id,
    );

    return event;
  }

  @Patch('events/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateEvent(@Param('id') id: string, @Body() body: any) {
    return this.homeService.updateEvent(Number(id), body);
  }

  @Delete('events/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  deleteEvent(@Param('id') id: string) {
    return this.homeService.deleteEvent(Number(id));
  }

  // ── Department News ───────────────────────────────────────────
  @Get('news')
  @UseGuards(JwtAuthGuard)
  getDepartmentNews() { return this.homeService.getDepartmentNews(); }

  @Post('news')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async createDepartmentNews(@Request() req: any, @Body() body: any) {
    const news = await this.homeService.createDepartmentNews({ ...body, createdBy: req.user.sub });

    // 🔔 Notification: thông báo tất cả nhân viên có tin phòng ban mới
    await this.broadcastNotification(
      'department_news', 'Tin phòng ban mới',
      `🏢 ${body.title}${body.department ? ` — ${body.department}` : ''}`,
      news.id,
    );

    return news;
  }

  @Patch('news/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateDepartmentNews(@Param('id') id: string, @Body() body: any) {
    return this.homeService.updateDepartmentNews(Number(id), body);
  }

  @Delete('news/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  deleteDepartmentNews(@Param('id') id: string) {
    return this.homeService.deleteDepartmentNews(Number(id));
  }
}
