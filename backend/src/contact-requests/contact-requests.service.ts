import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactRequest, RequestStatus } from './contact-request.entity';

@Injectable()
export class ContactRequestsService {
  constructor(
    @InjectRepository(ContactRequest)
    private repo: Repository<ContactRequest>,
  ) {}

  async create(
    userId: number,
    userName: string,
    userEmail: string,
    type: string,
    subject: string,
    priority: string,
    content: string,
  ): Promise<ContactRequest> {
    const req = this.repo.create({
      userId, userName, userEmail,
      type: type as any,
      subject, priority: priority as any, content,
      status: 'pending',
    });
    return this.repo.save(req);
  }

  // Lấy tất cả (dành cho admin)
  async findAll(status?: string): Promise<ContactRequest[]> {
    const query = this.repo.createQueryBuilder('req').orderBy('req.createdAt', 'DESC');
    if (status) query.where('req.status = :status', { status });
    return query.getMany();
  }

  // Lấy theo user
  async findByUser(userId: number): Promise<ContactRequest[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<ContactRequest> {
    const req = await this.repo.findOne({ where: { id } });
    if (!req) throw new NotFoundException('Không tìm thấy yêu cầu');
    return req;
  }

  // Admin reply
  async reply(id: number, adminReply: string, repliedBy: string): Promise<ContactRequest> {
    const req = await this.findOne(id);
    req.adminReply = adminReply;
    req.repliedBy = repliedBy;
    req.repliedAt = new Date();
    req.status = 'resolved';
    return this.repo.save(req);
  }

  // Cập nhật status
  async updateStatus(id: number, status: RequestStatus): Promise<ContactRequest> {
    const req = await this.findOne(id);
    req.status = status;
    return this.repo.save(req);
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const req = await this.repo.findOne({ where: { id, userId } });
    if (!req) return false;
    await this.repo.delete(id);
    return true;
  }

  // Stats cho admin
  async getStats() {
    const total = await this.repo.count();
    const pending = await this.repo.count({ where: { status: 'pending' } });
    const reviewing = await this.repo.count({ where: { status: 'reviewing' } });
    const resolved = await this.repo.count({ where: { status: 'resolved' } });
    return { total, pending, reviewing, resolved };
  }
}
