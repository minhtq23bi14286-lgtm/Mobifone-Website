import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Helmet: Them HTTP security headers (X-Frame-Options, Content-Security-Policy, ...)
  app.use(helmet());

  // ValidationPipe: Kiem tra du lieu dau vao tu client
  // whitelist: true - loai bo properties khong duoc khai bao trong DTO
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // CORS: Cho phep frontend truy cap API
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'https://mobifone-website.vercel.app',
    ],
    credentials: true,
  });

  await app.listen(3000, '0.0.0.0');
  console.log('Backend dang chay tai http://localhost:3000');
}

bootstrap();