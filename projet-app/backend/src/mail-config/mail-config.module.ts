import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { EmailTemplatesModule } from '../email-templates/email-templates.module';
import { EmailModule } from '../email/email.module';
import { SmtpConfigService } from './smtp-config.service';
import { SmtpConnectionTester } from './smtp-connection-tester.service';
import { TestEmailSender } from './test-email-sender.service';
import { CryptoUtil } from './crypto.util';
import { MailConfigController } from './mail-config.controller';

@Module({
  imports: [SettingsModule, EmailTemplatesModule, EmailModule],
  controllers: [MailConfigController],
  providers: [SmtpConfigService, SmtpConnectionTester, TestEmailSender, CryptoUtil],
  exports: [SmtpConfigService],
})
export class MailConfigModule {}
