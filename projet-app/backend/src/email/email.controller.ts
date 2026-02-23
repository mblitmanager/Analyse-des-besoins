import { Body, Controller, Post } from '@nestjs/common';
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
  async sendGeneric(@Body() payload: SendEmailDto) {
    const { to, subject, body } = payload;
    return this.emailService.sendReport(to, subject, body);
  }
}

