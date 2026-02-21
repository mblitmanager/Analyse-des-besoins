import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Get('setup')
  async setup() {
    await this.authService.createInitialAdmin();
    return { message: 'Setup completed' };
  }
}
