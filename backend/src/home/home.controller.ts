import { Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { HomeService } from './home.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/home')
export class HomeController {
  constructor(private homeService: HomeService) {}

  // ── Announcements ─────────────────────────────────────────────
  @Get('announcements')
  @UseGuards(JwtAuthGuard)
  getAnnouncements() { return this.homeService.getAnnouncements(); }

  @Post('announcements')
  @UseGuards(JwtAuthGuard)
  createAnnouncement(@Request() req: any, @Body() body: any) {
    return this.homeService.createAnnouncement({ ...body, createdBy: req.user.sub });
  }

  @Patch('announcements/:id')
  @UseGuards(JwtAuthGuard)
  updateAnnouncement(@Param('id') id: string, @Body() body: any) {
    return this.homeService.updateAnnouncement(Number(id), body);
  }

  @Delete('announcements/:id')
  @UseGuards(JwtAuthGuard)
  deleteAnnouncement(@Param('id') id: string) {
    return this.homeService.deleteAnnouncement(Number(id));
  }

  // ── Events ────────────────────────────────────────────────────
  @Get('events')
  @UseGuards(JwtAuthGuard)
  getEvents() { return this.homeService.getEvents(); }

  @Post('events')
  @UseGuards(JwtAuthGuard)
  createEvent(@Request() req: any, @Body() body: any) {
    return this.homeService.createEvent({ ...body, createdBy: req.user.sub });
  }

  @Patch('events/:id')
  @UseGuards(JwtAuthGuard)
  updateEvent(@Param('id') id: string, @Body() body: any) {
    return this.homeService.updateEvent(Number(id), body);
  }

  @Delete('events/:id')
  @UseGuards(JwtAuthGuard)
  deleteEvent(@Param('id') id: string) {
    return this.homeService.deleteEvent(Number(id));
  }

  // ── Department News ───────────────────────────────────────────
  @Get('news')
  @UseGuards(JwtAuthGuard)
  getDepartmentNews() { return this.homeService.getDepartmentNews(); }

  @Post('news')
  @UseGuards(JwtAuthGuard)
  createDepartmentNews(@Request() req: any, @Body() body: any) {
    return this.homeService.createDepartmentNews({ ...body, createdBy: req.user.sub });
  }

  @Patch('news/:id')
  @UseGuards(JwtAuthGuard)
  updateDepartmentNews(@Param('id') id: string, @Body() body: any) {
    return this.homeService.updateDepartmentNews(Number(id), body);
  }

  @Delete('news/:id')
  @UseGuards(JwtAuthGuard)
  deleteDepartmentNews(@Param('id') id: string) {
    return this.homeService.deleteDepartmentNews(Number(id));
  }
}