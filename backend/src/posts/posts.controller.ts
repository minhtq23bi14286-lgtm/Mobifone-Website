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
import { NotificationsService } from '../notifications/notifications.service';
import { ChatGateway } from '../chat/chat.gateway';

@Controller('api/posts')
export class PostsController {
  constructor(
    private postsService: PostsService,
    private notificationsService: NotificationsService,
    private chatGateway: ChatGateway,
  ) {}

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
    const displayName = req.user.displayName || user.displayName || 'Người dùng';
    const comment = await this.postsService.addComment(Number(id), req.user.sub, body.content, displayName);

    // 🔔 Notification: thông báo chủ bài viết có comment mới
    const post = await this.postsService.getPostById(Number(id));
    if (post && post.userId !== req.user.sub) {
      await this.notificationsService.createNotification(
        post.userId, 'comment', 'Bình luận mới',
        `${displayName} đã bình luận bài viết "${post.title}"`, post.id,
      );
      // Emit real-time notification (includes commentId for highlight)
      this.chatGateway.server.emit('newNotification', {
        userId: post.userId,
        type: 'comment',
        title: 'Bình luận mới',
        content: `${displayName} đã bình luận bài viết "${post.title}"`,
        referenceId: post.id,
        commentId: comment.id,
        createdAt: new Date(),
      });
    }

    return comment;
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
    const post = await this.postsService.approvePost(Number(id), req.user.sub);

    // 🔔 Notification: thông báo tác giả bài viết đã được duyệt
    await this.notificationsService.createNotification(
      post.userId, 'post_approved', 'Bài viết được duyệt',
      `Bài viết "${post.title}" của bạn đã được phê duyệt và hiển thị trên diễn đàn`, post.id,
    );
    this.chatGateway.server.emit('newNotification', {
      userId: post.userId,
      type: 'post_approved',
      title: 'Bài viết được duyệt',
      content: `Bài viết "${post.title}" của bạn đã được phê duyệt và hiển thị trên diễn đàn`,
      referenceId: post.id,
      createdAt: new Date(),
    });

    return post;
  }

  @Patch('admin/:id/reject')
  @UseGuards(JwtAuthGuard)
  async rejectPost(@Param('id') id: string, @Request() req: any, @Body() body: { reason?: string }) {
    const post = await this.postsService.rejectPost(Number(id), req.user.sub, body.reason);

    // 🔔 Notification: thông báo tác giả bài viết bị từ chối
    const reason = body.reason || 'Nội dung không phù hợp';
    await this.notificationsService.createNotification(
      post.userId, 'post_rejected', 'Bài viết bị từ chối',
      `Bài viết "${post.title}" không được duyệt. Lý do: ${reason}`, post.id,
    );
    this.chatGateway.server.emit('newNotification', {
      userId: post.userId,
      type: 'post_rejected',
      title: 'Bài viết bị từ chối',
      content: `Bài viết "${post.title}" không được duyệt. Lý do: ${reason}`,
      referenceId: post.id,
      createdAt: new Date(),
    });

    return post;
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard)
  async adminDeletePost(@Param('id') id: string) {
    const success = await this.postsService.adminDeletePost(Number(id));
    return { success };
  }
}