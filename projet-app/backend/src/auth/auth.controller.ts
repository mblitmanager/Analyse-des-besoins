import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() body: any) {
    const { email, password, name } = body;
    if (!email || !password) {
      return { message: 'Missing email or password' };
    }
    const user = await this.authService.registerAdmin(email, password, name);
    return { id: user.id, email: user.email };
  }

  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@Request() req: any) {
    return req.user;
  }

  @Get('setup')
  async setup() {
    await this.authService.createInitialAdmin();
    return { message: 'Setup completed' };
  }
}
