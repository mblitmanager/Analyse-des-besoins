import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendReport(to: string, subject: string, content: string) {
    try {
      console.log(`[EmailService] Sending email to ${to}`);
      await this.mailerService.sendMail({
        to,
        subject,
        html: content,
      });
      return { success: true };
    } catch (error) {
      console.error(`[EmailService] Error sending email:`, error);
      return { success: false, error: error.message };
    }
  }
}
