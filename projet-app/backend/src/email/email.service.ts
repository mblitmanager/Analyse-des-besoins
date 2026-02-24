import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendReport(
    to: string,
    subject: string,
    content: string,
    attachments?: Array<{ filename: string; content: Buffer }>,
  ) {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        html: content,
        attachments: attachments || [],
      });
      return { success: true };
    } catch (error) {
      console.error(`[EmailService] Error sending email:`, error);
      return { success: false, error: error.message };
    }
  }

  async sendAssessmentReport(
    stagiaireName: string,
    email: string,
    formation: string,
    score: number,
  ) {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #0D1B3E;">Félicitations, ${stagiaireName} !</h2>
        <p>Votre évaluation pour la formation <strong>${formation}</strong> est terminée.</p>
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #6c757d;">Votre Score Global</p>
          <h1 style="margin: 5px 0; color: #2563eb;">${score}%</h1>
        </div>
        <p>Un conseiller pédagogique Wizy-Learn prendra contact avec vous très prochainement pour discuter de votre parcours personnalisé.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">Ceci est un message automatique, merci de ne pas y répondre.</p>
      </div>
    `;
    return this.sendReport(
      email,
      `Votre Résultat d'Évaluation - ${formation}`,
      html,
    );
  }
}
