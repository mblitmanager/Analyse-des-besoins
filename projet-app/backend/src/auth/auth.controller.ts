import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  NotFoundException,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}


  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body?.email, body?.password);
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
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }
    await this.authService.createInitialAdmin();
    return { message: 'Setup completed' };
  }
}
