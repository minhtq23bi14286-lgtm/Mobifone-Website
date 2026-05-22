import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './announcement.entity';
import { Event } from './event.entity';
import { DepartmentNews } from './department-news.entity';

@Injectable()
export class HomeService {
  constructor(
    @InjectRepository(Announcement) private announcementRepo: Repository<Announcement>,
    @InjectRepository(Event)        private eventRepo: Repository<Event>,
    @InjectRepository(DepartmentNews) private newsRepo: Repository<DepartmentNews>,
  ) {}

  // ── Announcements ─────────────────────────────────────────────
  async getAnnouncements(): Promise<Announcement[]> {
    return this.announcementRepo.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
      take: 5,
    });
  }

  async createAnnouncement(data: Partial<Announcement>): Promise<Announcement> {
    const ann = this.announcementRepo.create(data);
    return this.announcementRepo.save(ann);
  }

  async updateAnnouncement(id: number, data: Partial<Announcement>): Promise<Announcement | null> {
    await this.announcementRepo.update(id, data);
    return this.announcementRepo.findOne({ where: { id } });
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    const result = await this.announcementRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  // ── Events ────────────────────────────────────────────────────
  async getEvents(): Promise<Event[]> {
    return this.eventRepo.find({
      where: { isActive: true },
      order: { date: 'ASC' },
      take: 10,
    });
  }

  async createEvent(data: Partial<Event>): Promise<Event> {
    const event = this.eventRepo.create(data);
    return this.eventRepo.save(event);
  }

  async updateEvent(id: number, data: Partial<Event>): Promise<Event | null> {
    await this.eventRepo.update(id, data);
    return this.eventRepo.findOne({ where: { id } });
  }

  async deleteEvent(id: number): Promise<boolean> {
    const result = await this.eventRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  // ── Department News ───────────────────────────────────────────
  async getDepartmentNews(): Promise<DepartmentNews[]> {
    return this.newsRepo.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
      take: 4,
    });
  }

  async createDepartmentNews(data: Partial<DepartmentNews>): Promise<DepartmentNews> {
    const news = this.newsRepo.create(data);
    return this.newsRepo.save(news);
  }

  async updateDepartmentNews(id: number, data: Partial<DepartmentNews>): Promise<DepartmentNews | null> {
    await this.newsRepo.update(id, data);
    return this.newsRepo.findOne({ where: { id } });
  }

  async deleteDepartmentNews(id: number): Promise<boolean> {
    const result = await this.newsRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}