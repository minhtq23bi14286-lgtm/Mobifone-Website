import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { Post } from './post.entity';
import { Comment } from './comment.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Comment]),
    NotificationsModule,
    ChatModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}