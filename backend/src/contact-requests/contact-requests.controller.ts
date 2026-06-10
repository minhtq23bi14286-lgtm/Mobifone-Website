import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, Request, UseGuards,
} from '@nestjs/common';
import { ContactRequestsService } from './contact-requests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('api/contact-requests')
@UseGuards(JwtAuthGuard)
export class ContactRequestsController {
  constructor(private service: ContactRequestsService) {}

  // User gửi yêu cầu
  @Post()
  async create(
    @Request() req: any,
    @Body() body: {
      type: string;
      subject: string;
      priority: string;
      content: string;
    },
  ) {
    return this.service.create(
      req.user.sub,
      req.user.displayName || 'Người dùng',
      req.user.email || '',
      body.type,
      body.subject,
      body.priority,
      body.content,
    );
  }

  // User xem yêu cầu của mình
  @Get('my')
  async getMyRequests(@Request() req: any) {
    return this.service.findByUser(req.user.sub);
  }

  // Admin xem tất cả
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getAll(@Query('status') status?: string) {
    return this.service.findAll(status);
  }

  // Admin xem stats
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getStats() {
    return this.service.getStats();
  }

  // Admin reply
  @Patch(':id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async reply(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { adminReply: string },
  ) {
    return this.service.reply(
      Number(id),
      body.adminReply,
      req.user.displayName || 'Admin',
    );
  }

  // Admin đổi status
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.service.updateStatus(Number(id), body.status as any);
  }

  // User xóa yêu cầu của mình
  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    const success = await this.service.delete(Number(id), req.user.sub);
    return { success };
  }
}
