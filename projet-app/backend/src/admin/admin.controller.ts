import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
  }

  @Post('users')
  createAdmin(@Body() body: any) {
    return this.adminService.createAdmin(body.email, body.password);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(+id);
  }
}
