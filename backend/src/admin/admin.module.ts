import { Module } from '@nestjs/common';
import { AdminStatsController } from './admin-stats.controller';
import { UsersModule } from '../users/users.module';
import { ChatModule } from '../chat/chat.module';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [UsersModule, ChatModule, SecurityModule],
  controllers: [AdminStatsController],
})
export class AdminModule {}
