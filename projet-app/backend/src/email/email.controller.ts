import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmailService } from './email.service';

interface SendEmailDto {
  to: string;
  subject: string;
  body: string;
}

@Controller()
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send-email')
  @UseGuards(JwtAuthGuard)
  async sendGeneric(@Body() payload: SendEmailDto) {
    const { to, subject, body } = payload;
    return this.emailService.sendReport(to, subject, body);
  }
}
