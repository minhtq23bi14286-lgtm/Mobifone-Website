import { Module } from '@nestjs/common';
import { AdminStatsController } from './admin-stats.controller';
import { UsersModule } from '../users/users.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [UsersModule, ChatModule],
  controllers: [AdminStatsController],
})
export class AdminModule {}
