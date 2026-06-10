import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('api/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('contacts')
  async getContacts() {
    return this.usersService.findAll();
  }

  @Get()
  @Roles('admin')
  async getUsers() {
    return this.usersService.findAll();
  }

  @Get('generate-password')
  @Roles('admin')
  generatePassword() {
    return { password: this.usersService.generatePassword() };
  }

  @Post()
  @Roles('admin')
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

  @Patch(':id')
  @Roles('admin')
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

  @Patch(':id/reset-password')
  @Roles('admin')
  async resetPassword(
    @Param('id') id: string,
    @Body() body: { newPassword?: string },
  ) {
    return this.usersService.resetPassword(Number(id), body.newPassword);
  }

  @Patch(':id/toggle-active')
  @Roles('admin')
  async toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(Number(id));
  }

  @Delete(':id')
  @Roles('admin')
  async deleteUser(@Param('id') id: string) {
    const success = await this.usersService.deleteUser(Number(id));
    return { success };
  }

  @Delete(':id/hard')
  @Roles('admin')
  async hardDelete(@Param('id') id: string) {
    const success = await this.usersService.hardDeleteUser(Number(id));
    return { success };
  }
}
