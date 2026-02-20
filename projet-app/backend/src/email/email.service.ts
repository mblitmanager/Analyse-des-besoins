import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  async sendReport(to: string, subject: string, content: string) {
    console.log(`[EmailService] Sending email to ${to}`);
    console.log(`[EmailService] Subject: ${subject}`);
    console.log(`[EmailService] Content: ${content}`);
    // In a real scenario, use nodemailer here
    return { success: true, messageId: 'mock-id' };
  }
}
