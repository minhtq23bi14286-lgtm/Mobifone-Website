import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import express from 'express'; 
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PostsModule } from './posts/posts.module';
import { ContactRequestsModule } from './contact-requests/contact-requests.module';
import { AdminModule } from './admin/admin.module';
import { SecurityModule } from './security/security.module';
import { SystemModule } from './system/system.module';
import { HomeModule } from './home/home.module';
import { LoggingMiddleware } from './common/logging.middleware';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...(isProduction
        ? {
            url: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
          }
        : {
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 5432,
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE || 'mobifone_db',
          }
      ),
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    AuthModule,
    UsersModule,
    ChatModule,
    NotificationsModule,
    PostsModule,
    ContactRequestsModule,
    AdminModule,
    SecurityModule,
    SystemModule,
    HomeModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // ✅ Middleware 1: Serve static files từ uploads folder
    // 
    // Cách hoạt động:
    // - express.static() là middleware của Express framework
    // - Nó serve các file từ thư mục uploads tới client
    // - Khi request đến /uploads/chat/filename, Express tự động 
    //   tìm file tương ứng và trả về
    //
    // Lợi ích:
    // - Frontend có thể xem preview file sau khi upload
    // - Người dùng có thể download file
    // - Hình ảnh/PDF được render trong browser
    consumer
      .apply(express.static(join(__dirname, '..', 'uploads')))
      .forRoutes('/uploads');

    // ✅ Middleware 2: HTTP Logging middleware
    // 
    // Ghi log response time của mỗi HTTP request:
    // GET /api/posts → 200 | 95ms
    // POST /api/posts → 201 | 450ms
    // 
    // Dùng để đo hiệu năng backend
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}