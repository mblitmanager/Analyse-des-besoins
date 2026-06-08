import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SmtpConfigDto } from './dto/smtp-config.dto';

@Injectable()
export class SmtpConnectionTester {
  /**
   * Tests the SMTP connection using the provided configuration.
   * Creates a temporary nodemailer transport, calls verify(), and returns the result.
   * The transport is always closed in a finally block.
   */
  async testConnection(
    config: SmtpConfigDto,
  ): Promise<{ success: boolean; error?: string }> {
    const transportOptions: any = {
      host: config.host,
      port: config.port,
      secure: config.encryption === 'ssl',
      auth: {
        user: config.username,
        pass: config.password,
      },
    };

    if (config.encryption === 'tls') {
      transportOptions.requireTLS = true;
      transportOptions.secure = false;
    }

    const transport = nodemailer.createTransport(transportOptions);

    try {
      await transport.verify();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      transport.close();
    }
  }
}
