import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { Announcement } from './announcement.entity';
import { Event } from './event.entity';
import { DepartmentNews } from './department-news.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Announcement, Event, DepartmentNews])],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}