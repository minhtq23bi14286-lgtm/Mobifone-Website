import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('api/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // Lấy danh sách tất cả users
  @Get()
  async getUsers() {
    return this.usersService.findAll();
  }

  // Generate mật khẩu ngẫu nhiên (không tạo user)
  @Get('generate-password')
  generatePassword() {
    return { password: this.usersService.generatePassword() };
  }

  // Tạo user mới
  @Post()
  async createUser(
    @Body() body: {
      email: string;
      password: string;
      displayName: string;
      role?: string;
      department?: string;
    },
  ) {
    return this.usersService.createUser(
      body.email,
      body.password,
      body.displayName,
      body.role,
      body.department,
    );
  }

  // Cập nhật thông tin user
  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: {
      displayName?: string;
      role?: string;
      department?: string;
      isActive?: boolean;
    },
  ) {
    return this.usersService.updateUser(Number(id), body);
  }

  // Reset / đặt lại mật khẩu
  @Patch(':id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @Body() body: { newPassword?: string },
  ) {
    return this.usersService.resetPassword(Number(id), body.newPassword);
  }

  // Toggle active/inactive
  @Patch(':id/toggle-active')
  async toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(Number(id));
  }

  // Soft delete (deactivate)
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    const success = await this.usersService.deleteUser(Number(id));
    return { success };
  }

  // Hard delete
  @Delete(':id/hard')
  async hardDelete(@Param('id') id: string) {
    const success = await this.usersService.hardDeleteUser(Number(id));
    return { success };
  }
}
