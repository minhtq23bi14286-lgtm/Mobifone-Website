import {
  Controller, Get, Delete, Patch, Param,
  UseGuards, Body
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SystemService } from './system.service';

@Controller('api/system')
@UseGuards(JwtAuthGuard)
export class SystemController {
  constructor(private systemService: SystemService) {}

  // Thông tin hệ thống
  @Get('info')
  async getSystemInfo() {
    return this.systemService.getSystemInfo();
  }

  // Danh sách file upload
  @Get('files')
  async getFiles() {
    return this.systemService.getUploadedFiles();
  }

  // Xóa file
  @Delete('files/:filename')
  async deleteFile(@Param('filename') filename: string) {
    return this.systemService.deleteFile(filename);
  }

  // Lấy cấu hình tính năng
  @Get('features')
  async getFeatures() {
    return this.systemService.getFeatures();
  }

  // Bật/tắt tính năng
  @Patch('features/:key')
  async toggleFeature(
    @Param('key') key: string,
    @Body() body: { enabled: boolean },
  ) {
    return this.systemService.toggleFeature(key, body.enabled);
  }

  // Lấy cấu hình upload
  @Get('upload-config')
  async getUploadConfig() {
    return this.systemService.getUploadConfig();
  }

  // Cập nhật giới hạn upload
  @Patch('upload-config')
  async updateUploadConfig(@Body() body: { maxFileSizeMB: number }) {
    return this.systemService.updateUploadConfig(body.maxFileSizeMB);
  }
}