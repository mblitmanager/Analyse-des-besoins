import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class TestEmailSender {
  constructor(private readonly mailerService: MailerService) {}

  /**
   * Sends a test email to the specified address using the current SMTP configuration.
   * Returns success/failure status with optional error message.
   */
  async sendTestEmail(
    to: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.mailerService.sendMail({
        to,
        subject: '[AB] Email de test',
        html: '<p>Ceci est un email de test envoyé depuis le back-office Analyses des Besoins.</p>',
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
