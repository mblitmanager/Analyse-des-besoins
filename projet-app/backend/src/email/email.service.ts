import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as path from 'path';
import * as fs from 'fs';

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
    const publicPath = path.resolve(__dirname, '../../../public');
    const logoAopiaPath = path.join(publicPath, 'logo/Logo-AOPIA.png');
    const logoLikePath = path.join(publicPath, 'logo/Logo_Like_Formation.png');

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
        
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:logo_aopia" alt="AOPIA" style="height: 30px; margin: 0 10px; vertical-align: middle;">
          <img src="cid:logo_like" alt="Like Formation" style="height: 30px; margin: 0 10px; vertical-align: middle;">
        </div>

        <p style="text-align: center; font-size: 10px; color: #999; margin: 0;">
          Document généré automatiquement par NS Conseil - Wizy Learn
        </p>
      </div>
    `;

    const attachments = [];
    if (fs.existsSync(logoAopiaPath)) {
      attachments.push({
        filename: 'logo-aopia.png',
        path: logoAopiaPath,
        cid: 'logo_aopia',
      });
    }
    if (fs.existsSync(logoLikePath)) {
      attachments.push({
        filename: 'logo-like.png',
        path: logoLikePath,
        cid: 'logo_like',
      });
    }

    return this.sendReport(
      email,
      `Votre Résultat d'Évaluation - ${formation}`,
      html,
      attachments,
    );
  }
}
