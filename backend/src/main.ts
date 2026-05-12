import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'EXISTS' : 'MISSING');
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
 app.enableCors({
  origin: ['http://localhost:5173', 'https://mobifone-website.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
});

  await app.listen(3000, '0.0.0.0');
}

bootstrap();
