import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as nodemailer from 'nodemailer';
import { SettingsService } from '../settings/settings.service';
import { CryptoUtil } from './crypto.util';
import { SmtpConfigDto, SmtpDisplayDto, UpdateSmtpConfigDto } from './dto';

@Injectable()
export class SmtpConfigService implements OnModuleInit {
  private readonly logger = new Logger(SmtpConfigService.name);
  private readonly SMTP_KEYS = {
    host: 'SMTP_HOST',
    port: 'SMTP_PORT',
    username: 'SMTP_USERNAME',
    password: 'SMTP_PASSWORD',
    encryption: 'SMTP_ENCRYPTION',
  };

  constructor(
    private readonly settingsService: SettingsService,
    private readonly mailerService: MailerService,
    private readonly cryptoUtil: CryptoUtil,
  ) {}

  /**
   * On module initialization, apply the SMTP transport from database config
   * if one exists. This ensures the DB config takes precedence over .env defaults.
   */
  async onModuleInit(): Promise<void> {
    try {
      const config = await this.getConfig();

      // Only apply transport if a host is configured in the database
      if (config.host) {
        await this.applyTransport();
        this.logger.log(
          `SMTP transport configured from database: ${config.host}:${config.port}`,
        );
      } else {
        this.logger.log(
          'No SMTP configuration found in database, using default .env transport',
        );
      }
    } catch (error) {
      this.logger.warn(
        `Failed to apply SMTP configuration from database at startup: ${error.message}`,
      );
      // Do not throw — gracefully fall back to .env config
    }
  }

  /**
   * Retrieves the current SMTP configuration from the settings repository.
   * Decrypts the password before returning.
   */
  async getConfig(): Promise<SmtpConfigDto> {
    const [host, port, username, encryptedPassword, encryption] =
      await Promise.all([
        this.settingsService.getValue(this.SMTP_KEYS.host, ''),
        this.settingsService.getValue(this.SMTP_KEYS.port, '587'),
        this.settingsService.getValue(this.SMTP_KEYS.username, ''),
        this.settingsService.getValue(this.SMTP_KEYS.password, ''),
        this.settingsService.getValue(this.SMTP_KEYS.encryption, 'none'),
      ]);

    let password = '';
    if (encryptedPassword) {
      try {
        password = this.cryptoUtil.decrypt(encryptedPassword);
      } catch {
        // If decryption fails, return empty password
        password = '';
      }
    }

    const config = new SmtpConfigDto();
    config.host = host;
    config.port = parseInt(port, 10) || 587;
    config.username = username;
    config.password = password;
    config.encryption = encryption;

    return config;
  }

  /**
   * Retrieves the SMTP configuration for display purposes.
   * The password is masked with bullet characters.
   */
  async getConfigForDisplay(): Promise<SmtpDisplayDto> {
    const [host, port, username, encryptedPassword, encryption] =
      await Promise.all([
        this.settingsService.getValue(this.SMTP_KEYS.host, ''),
        this.settingsService.getValue(this.SMTP_KEYS.port, '587'),
        this.settingsService.getValue(this.SMTP_KEYS.username, ''),
        this.settingsService.getValue(this.SMTP_KEYS.password, ''),
        this.settingsService.getValue(this.SMTP_KEYS.encryption, 'none'),
      ]);

    const display = new SmtpDisplayDto();
    display.host = host;
    display.port = parseInt(port, 10) || 587;
    display.username = username;
    display.password = '••••••••';
    display.encryption = encryption;
    display.hasPassword = !!encryptedPassword;

    return display;
  }

  /**
   * Saves the SMTP configuration to the settings repository.
   * Encrypts the password if provided, then applies the new transport.
   */
  async saveConfig(dto: UpdateSmtpConfigDto): Promise<void> {
    await Promise.all([
      this.settingsService.update(this.SMTP_KEYS.host, dto.host),
      this.settingsService.update(this.SMTP_KEYS.port, String(dto.port)),
      this.settingsService.update(this.SMTP_KEYS.username, dto.username),
      this.settingsService.update(this.SMTP_KEYS.encryption, dto.encryption),
    ]);

    // Only update password if a new one is provided
    if (dto.password) {
      const encryptedPassword = this.cryptoUtil.encrypt(dto.password);
      await this.settingsService.update(
        this.SMTP_KEYS.password,
        encryptedPassword,
      );
    }

    await this.applyTransport();
  }

  /**
   * Reconfigures the MailerService transport dynamically
   * using the current SMTP settings from the database.
   */
  async applyTransport(): Promise<void> {
    const config = await this.getConfig();

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

    // Access the internal nodemailer transporter via MailerService
    const mailer = this.mailerService as any;
    mailer.transporter = nodemailer.createTransport(transportOptions);
  }
}
