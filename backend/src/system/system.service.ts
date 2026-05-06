import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// File lưu cấu hình (đơn giản, không cần DB)
const CONFIG_FILE = path.join(process.cwd(), 'system-config.json');

interface SystemConfig {
  features: Record<string, boolean>;
  maxFileSizeMB: number;
}

const DEFAULT_CONFIG: SystemConfig = {
  features: {
    forum: true,
    chat: true,
    videoCall: true,
    fileUpload: true,
    gifSearch: true,
    notifications: true,
  },
  maxFileSizeMB: 50,
};

@Injectable()
export class SystemService {
  private startTime = Date.now();

  private loadConfig(): SystemConfig {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      }
    } catch { /* ignore */ }
    return { ...DEFAULT_CONFIG };
  }

  private saveConfig(config: SystemConfig): void {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  }

  // ── Thông tin hệ thống ────────────────────────────────────────
  async getSystemInfo() {
    const uptimeMs = Date.now() - this.startTime;
    const uptimeHours = Math.floor(uptimeMs / 3600000);
    const uptimeMinutes = Math.floor((uptimeMs % 3600000) / 60000);

    // Thông tin uploads folder
    const uploadDir = path.join(process.cwd(), 'uploads');
    let totalFiles = 0;
    let totalSizeMB = 0;

    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      totalFiles = files.length;
      totalSizeMB = files.reduce((acc, file) => {
        try {
          const stat = fs.statSync(path.join(uploadDir, file));
          return acc + stat.size;
        } catch { return acc; }
      }, 0) / (1024 * 1024);
    }

    // Memory usage
    const mem = process.memoryUsage();

    return {
      appName: 'MobiFone Internal Network',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      uptime: `${uptimeHours}h ${uptimeMinutes}m`,
      uptimeMs,
      startedAt: new Date(this.startTime).toISOString(),
      memory: {
        used: Math.round(mem.heapUsed / 1024 / 1024),
        total: Math.round(mem.heapTotal / 1024 / 1024),
        rss: Math.round(mem.rss / 1024 / 1024),
      },
      storage: {
        totalFiles,
        totalSizeMB: Math.round(totalSizeMB * 100) / 100,
      },
    };
  }

  // ── Quản lý file ──────────────────────────────────────────────
  async getUploadedFiles() {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) return [];

    const files = fs.readdirSync(uploadDir);
    return files.map(filename => {
      const filepath = path.join(uploadDir, filename);
      const stat = fs.statSync(filepath);
      const ext = path.extname(filename).toLowerCase();
      let type = 'file';
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) type = 'image';
      else if (['.pdf'].includes(ext)) type = 'pdf';
      else if (['.mp4', '.mov', '.avi'].includes(ext)) type = 'video';

      return {
        filename,
        url: `/uploads/${filename}`,
        sizeMB: Math.round((stat.size / (1024 * 1024)) * 100) / 100,
        sizeKB: Math.round(stat.size / 1024),
        type,
        ext: ext.replace('.', '').toUpperCase(),
        createdAt: stat.birthtime.toISOString(),
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async deleteFile(filename: string): Promise<{ success: boolean }> {
    try {
      // Bảo mật: không cho xóa file ngoài uploads/
      const safeFilename = path.basename(filename);
      const filepath = path.join(process.cwd(), 'uploads', safeFilename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return { success: true };
      }
      return { success: false };
    } catch { return { success: false }; }
  }

  // ── Feature toggles ───────────────────────────────────────────
  async getFeatures(): Promise<Record<string, boolean>> {
    const config = this.loadConfig();
    return config.features;
  }

  async toggleFeature(key: string, enabled: boolean): Promise<Record<string, boolean>> {
    const config = this.loadConfig();
    config.features[key] = enabled;
    this.saveConfig(config);
    return config.features;
  }

  // ── Upload config ─────────────────────────────────────────────
  async getUploadConfig(): Promise<{ maxFileSizeMB: number }> {
    const config = this.loadConfig();
    return { maxFileSizeMB: config.maxFileSizeMB };
  }

  async updateUploadConfig(maxFileSizeMB: number): Promise<{ maxFileSizeMB: number }> {
    const config = this.loadConfig();
    config.maxFileSizeMB = maxFileSizeMB;
    this.saveConfig(config);
    return { maxFileSizeMB };
  }
}