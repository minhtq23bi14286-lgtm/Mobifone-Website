import { Controller, Delete, Param, Post, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { uploadFileFilter } from '../common/upload-file-filter';

@Controller('api/chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Delete('messages/:contactId')
  @UseGuards(JwtAuthGuard)
  async deleteMessages(@Request() req: any, @Param('contactId') contactId: string) {
    await this.chatService.deleteMessages(req.user.sub, Number(contactId));
    return { success: true };
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/chat',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: uploadFileFilter,
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return { url: `/uploads/chat/${file.filename}` };
  }
}
