import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, PostStatus } from './post.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  // Tạo bài mới — mặc định status = 'pending'
  async createPost(
    userId: number,
    title: string,
    content: string,
    category: string,
    attachments: string[],
  ): Promise<Post> {
    const post = this.postRepository.create({
      userId, title, content, category, attachments,
      status: 'pending',
    });
    return this.postRepository.save(post);
  }

  // Lấy bài đã được duyệt cho forum (user xem)
  async getPosts(category?: string): Promise<any[]> {
    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoin('users', 'u', 'u.id = post.userId')
      .addSelect(['u.displayName', 'u.role'])
      .where('post.status = :status', { status: 'approved' });

    if (category && category !== 'all') {
      query.andWhere('post.category = :category', { category });
    }

    const posts = await query.orderBy('post.createdAt', 'DESC').getRawMany();

    return posts.map(p => ({
      id: p.post_id,
      userId: p.post_userId,
      title: p.post_title,
      content: p.post_content,
      category: p.post_category,
      attachments: p.post_attachments,
      likes: p.post_likes,
      comments: p.post_comments,
      views: p.post_views,
      status: p.post_status,
      createdAt: p.post_createdAt,
      authorName: p.u_displayName || 'Người dùng',
      authorRole: p.u_role || 'employee',
    }));
  }

  // Lấy bài của user (kể cả pending/rejected — user xem bài của chính mình)
  async getMyPosts(userId: number): Promise<Post[]> {
    return this.postRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getPostById(id: number): Promise<Post | null> {
    const post = await this.postRepository.findOne({ where: { id } });
    if (post) {
      await this.postRepository.update(id, { views: post.views + 1 });
    }
    return post;
  }

  // ── Admin: lấy tất cả bài theo status ────────────────────────
  async getAllPostsAdmin(status?: string): Promise<any[]> {
    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoin('users', 'u', 'u.id = post.userId')
      .addSelect(['u.displayName', 'u.email', 'u.role']);

    if (status && status !== 'all') {
      query.where('post.status = :status', { status });
    }

    const posts = await query.orderBy('post.createdAt', 'DESC').getRawMany();

    return posts.map(p => ({
      id: p.post_id,
      userId: p.post_userId,
      title: p.post_title,
      content: p.post_content,
      category: p.post_category,
      attachments: p.post_attachments,
      likes: p.post_likes,
      comments: p.post_comments,
      views: p.post_views,
      status: p.post_status,
      rejectReason: p.post_rejectReason,
      reviewedAt: p.post_reviewedAt,
      createdAt: p.post_createdAt,
      authorName: p.u_displayName || 'Người dùng',
      authorEmail: p.u_email || '',
      authorRole: p.u_role || 'employee',
    }));
  }

  // Admin: stats kiểm duyệt
  async getModerationStats() {
    const [pending, approved, rejected, total] = await Promise.all([
      this.postRepository.count({ where: { status: 'pending' } }),
      this.postRepository.count({ where: { status: 'approved' } }),
      this.postRepository.count({ where: { status: 'rejected' } }),
      this.postRepository.count(),
    ]);
    return { pending, approved, rejected, total };
  }

  // Admin: duyệt bài
  async approvePost(id: number, adminId: number): Promise<Post> {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
    post.status = 'approved';
    post.reviewedBy = adminId;
    post.reviewedAt = new Date();
    post.rejectReason = undefined;
    return this.postRepository.save(post);
  }

  // Admin: từ chối bài
  async rejectPost(id: number, adminId: number, reason?: string): Promise<Post> {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
    post.status = 'rejected';
    post.reviewedBy = adminId;
    post.reviewedAt = new Date();
    post.rejectReason = reason || 'Nội dung không phù hợp';
    return this.postRepository.save(post);
  }

  // Admin: xóa bài
  async adminDeletePost(id: number): Promise<boolean> {
    const result = await this.postRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async likePost(id: number): Promise<void> {
    const post = await this.postRepository.findOne({ where: { id } });
    if (post) await this.postRepository.update(id, { likes: post.likes + 1 });
  }

  async deletePost(id: number, userId: number): Promise<boolean> {
    const post = await this.postRepository.findOne({ where: { id, userId } });
    if (!post) return false;
    await this.postRepository.delete(id);
    return true;
  }
}