import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SmtpConfigService } from './smtp-config.service';
import { SmtpConnectionTester } from './smtp-connection-tester.service';
import { TestEmailSender } from './test-email-sender.service';
import {
  UpdateSmtpConfigDto,
  SendTestEmailDto,
  OperationResultDto,
  SmtpDisplayDto,
} from './dto';

@ApiTags('mail-config')
@Controller('mail-config')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MailConfigController {
  constructor(
    private readonly smtpConfigService: SmtpConfigService,
    private readonly smtpConnectionTester: SmtpConnectionTester,
    private readonly testEmailSender: TestEmailSender,
  ) {}

  @Get('smtp')
  async getSmtpConfig(): Promise<SmtpDisplayDto> {
    return this.smtpConfigService.getConfigForDisplay();
  }

  @Put('smtp')
  async saveSmtpConfig(@Body() dto: UpdateSmtpConfigDto): Promise<void> {
    await this.smtpConfigService.saveConfig(dto);
  }

  @Post('smtp/test')
  async testSmtpConnection(): Promise<OperationResultDto> {
    const config = await this.smtpConfigService.getConfig();
    const result = await this.smtpConnectionTester.testConnection(config);

    const response = new OperationResultDto();
    response.success = result.success;
    if (result.success) {
      response.message = 'Connexion SMTP réussie';
    } else {
      response.error = result.error;
    }
    return response;
  }

  @Post('test-email')
  async sendTestEmail(@Body() dto: SendTestEmailDto): Promise<OperationResultDto> {
    const result = await this.testEmailSender.sendTestEmail(dto.to);

    const response = new OperationResultDto();
    response.success = result.success;
    if (result.success) {
      response.message = `Email de test envoyé à ${dto.to}`;
    } else {
      response.error = result.error;
    }
    return response;
  }
}
