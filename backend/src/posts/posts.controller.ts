import {
  Controller, Get, Post, Delete, Patch,
  Body, Param, Query, Request, UseGuards,
  UseInterceptors, UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getPosts(@Query('category') category?: string) {
    return this.postsService.getPosts(category);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyPosts(@Request() req: any) {
    return this.postsService.getMyPosts(req.user.sub);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  async getAllAdmin(@Query('status') status?: string) {
    return this.postsService.getAllPostsAdmin(status);
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard)
  async getModerationStats() {
    return this.postsService.getModerationStats();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getPostById(@Param('id') id: string) {
    return this.postsService.getPostById(Number(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10, {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
    limits: { fileSize: 50 * 1024 * 1024 },
  }))
  async createPost(
    @Request() req: any,
    @Body() body: { title: string; content: string; category: string },
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const attachments = files?.map(f => JSON.stringify({
      filename: f.originalname, path: `/uploads/${f.filename}`, size: f.size, mimetype: f.mimetype,
    })) || [];
    return this.postsService.createPost(req.user.sub, body.title, body.content, body.category, attachments);
  }

  @Patch(':id/like')
  @UseGuards(JwtAuthGuard)
  async likePost(@Param('id') id: string) {
    await this.postsService.likePost(Number(id));
    return { success: true };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deletePost(@Param('id') id: string, @Request() req: any) {
    const success = await this.postsService.deletePost(Number(id), req.user.sub);
    return { success };
  }

  // ── Comment endpoints ─────────────────────────────────────────

  @Get(':id/comments')
  @UseGuards(JwtAuthGuard)
  async getComments(@Param('id') id: string) {
    return this.postsService.getComments(Number(id));
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  async addComment(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { content: string },
  ) {
    const user = JSON.parse(Buffer.from(req.headers.authorization.split('.')[1], 'base64').toString());
    return this.postsService.addComment(Number(id), req.user.sub, body.content, req.user.displayName || user.displayName || 'Người dùng');
  }

  @Patch(':postId/comments/:commentId')
  @UseGuards(JwtAuthGuard)
  async editComment(
    @Param('commentId') commentId: string,
    @Request() req: any,
    @Body() body: { content: string },
  ) {
    const updated = await this.postsService.editComment(Number(commentId), req.user.sub, body.content);
    return updated ? updated : { success: false };
  }

  @Delete(':postId/comments/:commentId')
  @UseGuards(JwtAuthGuard)
  async deleteComment(
    @Param('commentId') commentId: string,
    @Request() req: any,
  ) {
    const success = await this.postsService.deleteComment(Number(commentId), req.user.sub);
    return { success };
  }

  // ── Admin endpoints ───────────────────────────────────────────

  @Patch('admin/:id/approve')
  @UseGuards(JwtAuthGuard)
  async approvePost(@Param('id') id: string, @Request() req: any) {
    return this.postsService.approvePost(Number(id), req.user.sub);
  }

  @Patch('admin/:id/reject')
  @UseGuards(JwtAuthGuard)
  async rejectPost(@Param('id') id: string, @Request() req: any, @Body() body: { reason?: string }) {
    return this.postsService.rejectPost(Number(id), req.user.sub, body.reason);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard)
  async adminDeletePost(@Param('id') id: string) {
    const success = await this.postsService.adminDeletePost(Number(id));
    return { success };
  }
}