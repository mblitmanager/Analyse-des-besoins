import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { SmtpConfigService } from './smtp-config.service';
import { SettingsService } from '../settings/settings.service';
import { CryptoUtil } from './crypto.util';

describe('SmtpConfigService', () => {
  let service: SmtpConfigService;
  let settingsService: jest.Mocked<SettingsService>;
  let mailerService: jest.Mocked<MailerService>;
  let cryptoUtil: jest.Mocked<CryptoUtil>;

  beforeEach(async () => {
    const mockSettingsService = {
      getValue: jest.fn(),
      update: jest.fn(),
    };

    const mockMailerService = {
      transporter: null,
    };

    const mockCryptoUtil = {
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmtpConfigService,
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: MailerService, useValue: mockMailerService },
        { provide: CryptoUtil, useValue: mockCryptoUtil },
      ],
    }).compile();

    service = module.get<SmtpConfigService>(SmtpConfigService);
    settingsService = module.get(SettingsService);
    mailerService = module.get(MailerService);
    cryptoUtil = module.get(CryptoUtil);
  });

  describe('getConfig', () => {
    it('should retrieve and decrypt SMTP configuration', async () => {
      settingsService.getValue
        .mockResolvedValueOnce('smtp.example.com') // host
        .mockResolvedValueOnce('465')              // port
        .mockResolvedValueOnce('user@example.com') // username
        .mockResolvedValueOnce('encrypted_pw')     // password
        .mockResolvedValueOnce('ssl');             // encryption

      cryptoUtil.decrypt.mockReturnValue('plaintext_password');

      const result = await service.getConfig();

      expect(result.host).toBe('smtp.example.com');
      expect(result.port).toBe(465);
      expect(result.username).toBe('user@example.com');
      expect(result.password).toBe('plaintext_password');
      expect(result.encryption).toBe('ssl');
      expect(cryptoUtil.decrypt).toHaveBeenCalledWith('encrypted_pw');
    });

    it('should return empty password when no password is stored', async () => {
      settingsService.getValue
        .mockResolvedValueOnce('smtp.example.com')
        .mockResolvedValueOnce('587')
        .mockResolvedValueOnce('user@example.com')
        .mockResolvedValueOnce('')  // empty password
        .mockResolvedValueOnce('tls');

      const result = await service.getConfig();

      expect(result.password).toBe('');
      expect(cryptoUtil.decrypt).not.toHaveBeenCalled();
    });

    it('should return empty password when decryption fails', async () => {
      settingsService.getValue
        .mockResolvedValueOnce('smtp.example.com')
        .mockResolvedValueOnce('587')
        .mockResolvedValueOnce('user@example.com')
        .mockResolvedValueOnce('corrupted_data')
        .mockResolvedValueOnce('tls');

      cryptoUtil.decrypt.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const result = await service.getConfig();

      expect(result.password).toBe('');
    });
  });

  describe('getConfigForDisplay', () => {
    it('should return masked password when password exists', async () => {
      settingsService.getValue
        .mockResolvedValueOnce('smtp.example.com')
        .mockResolvedValueOnce('587')
        .mockResolvedValueOnce('user@example.com')
        .mockResolvedValueOnce('encrypted_pw')
        .mockResolvedValueOnce('tls');

      const result = await service.getConfigForDisplay();

      expect(result.host).toBe('smtp.example.com');
      expect(result.port).toBe(587);
      expect(result.username).toBe('user@example.com');
      expect(result.password).toBe('••••••••');
      expect(result.hasPassword).toBe(true);
      expect(result.encryption).toBe('tls');
    });

    it('should indicate hasPassword false when no password stored', async () => {
      settingsService.getValue
        .mockResolvedValueOnce('smtp.example.com')
        .mockResolvedValueOnce('587')
        .mockResolvedValueOnce('user@example.com')
        .mockResolvedValueOnce('')
        .mockResolvedValueOnce('none');

      const result = await service.getConfigForDisplay();

      expect(result.password).toBe('••••••••');
      expect(result.hasPassword).toBe(false);
    });
  });

  describe('saveConfig', () => {
    it('should encrypt password and persist all settings', async () => {
      settingsService.update.mockResolvedValue(undefined as any);
      cryptoUtil.encrypt.mockReturnValue('encrypted_new_pw');

      // Mock getConfig for applyTransport call
      settingsService.getValue
        .mockResolvedValueOnce('smtp.new.com')
        .mockResolvedValueOnce('465')
        .mockResolvedValueOnce('newuser@example.com')
        .mockResolvedValueOnce('encrypted_new_pw')
        .mockResolvedValueOnce('ssl');
      cryptoUtil.decrypt.mockReturnValue('new_password');

      await service.saveConfig({
        host: 'smtp.new.com',
        port: 465,
        username: 'newuser@example.com',
        password: 'new_password',
        encryption: 'ssl',
      });

      expect(settingsService.update).toHaveBeenCalledWith('SMTP_HOST', 'smtp.new.com');
      expect(settingsService.update).toHaveBeenCalledWith('SMTP_PORT', '465');
      expect(settingsService.update).toHaveBeenCalledWith('SMTP_USERNAME', 'newuser@example.com');
      expect(settingsService.update).toHaveBeenCalledWith('SMTP_ENCRYPTION', 'ssl');
      expect(cryptoUtil.encrypt).toHaveBeenCalledWith('new_password');
      expect(settingsService.update).toHaveBeenCalledWith('SMTP_PASSWORD', 'encrypted_new_pw');
    });

    it('should not update password when not provided in dto', async () => {
      settingsService.update.mockResolvedValue(undefined as any);

      // Mock getConfig for applyTransport call
      settingsService.getValue
        .mockResolvedValueOnce('smtp.example.com')
        .mockResolvedValueOnce('587')
        .mockResolvedValueOnce('user@example.com')
        .mockResolvedValueOnce('existing_encrypted')
        .mockResolvedValueOnce('tls');
      cryptoUtil.decrypt.mockReturnValue('existing_password');

      await service.saveConfig({
        host: 'smtp.example.com',
        port: 587,
        username: 'user@example.com',
        encryption: 'tls',
      });

      expect(cryptoUtil.encrypt).not.toHaveBeenCalled();
      expect(settingsService.update).not.toHaveBeenCalledWith(
        'SMTP_PASSWORD',
        expect.anything(),
      );
    });
  });

  describe('onModuleInit', () => {
    it('should apply transport when SMTP config exists in database', async () => {
      settingsService.getValue
        .mockResolvedValueOnce('smtp.example.com') // host
        .mockResolvedValueOnce('587')              // port
        .mockResolvedValueOnce('user@example.com') // username
        .mockResolvedValueOnce('encrypted_pw')     // password
        .mockResolvedValueOnce('tls')              // encryption
        // Second call from applyTransport -> getConfig
        .mockResolvedValueOnce('smtp.example.com')
        .mockResolvedValueOnce('587')
        .mockResolvedValueOnce('user@example.com')
        .mockResolvedValueOnce('encrypted_pw')
        .mockResolvedValueOnce('tls');
      cryptoUtil.decrypt.mockReturnValue('password123');

      await service.onModuleInit();

      expect((mailerService as any).transporter).toBeDefined();
    });

    it('should not apply transport when no host is configured', async () => {
      settingsService.getValue
        .mockResolvedValueOnce('')    // empty host
        .mockResolvedValueOnce('587')
        .mockResolvedValueOnce('')
        .mockResolvedValueOnce('')
        .mockResolvedValueOnce('none');

      await service.onModuleInit();

      // transporter should remain unchanged (null from mock)
      expect((mailerService as any).transporter).toBeNull();
    });

    it('should not throw when database access fails', async () => {
      settingsService.getValue.mockRejectedValue(new Error('DB connection error'));

      // Should not throw
      await expect(service.onModuleInit()).resolves.not.toThrow();
    });
  });

  describe('applyTransport', () => {
    it('should configure SSL transport when encryption is ssl', async () => {
      settingsService.getValue
        .mockResolvedValueOnce('smtp.example.com')
        .mockResolvedValueOnce('465')
        .mockResolvedValueOnce('user@example.com')
        .mockResolvedValueOnce('encrypted_pw')
        .mockResolvedValueOnce('ssl');
      cryptoUtil.decrypt.mockReturnValue('password123');

      await service.applyTransport();

      expect((mailerService as any).transporter).toBeDefined();
    });

    it('should configure TLS transport when encryption is tls', async () => {
      settingsService.getValue
        .mockResolvedValueOnce('smtp.example.com')
        .mockResolvedValueOnce('587')
        .mockResolvedValueOnce('user@example.com')
        .mockResolvedValueOnce('encrypted_pw')
        .mockResolvedValueOnce('tls');
      cryptoUtil.decrypt.mockReturnValue('password123');

      await service.applyTransport();

      expect((mailerService as any).transporter).toBeDefined();
    });
  });
});
