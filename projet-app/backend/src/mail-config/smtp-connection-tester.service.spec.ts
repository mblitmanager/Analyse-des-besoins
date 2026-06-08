import { SmtpConnectionTester } from './smtp-connection-tester.service';
import { SmtpConfigDto } from './dto/smtp-config.dto';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('SmtpConnectionTester', () => {
  let tester: SmtpConnectionTester;
  let mockTransport: { verify: jest.Mock; close: jest.Mock };

  beforeEach(() => {
    tester = new SmtpConnectionTester();
    mockTransport = {
      verify: jest.fn(),
      close: jest.fn(),
    };
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransport);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  function buildConfig(overrides?: Partial<SmtpConfigDto>): SmtpConfigDto {
    const config = new SmtpConfigDto();
    config.host = 'smtp.example.com';
    config.port = 587;
    config.username = 'user@example.com';
    config.password = 'secret';
    config.encryption = 'tls';
    return Object.assign(config, overrides);
  }

  it('should return success true when verify() succeeds', async () => {
    mockTransport.verify.mockResolvedValue(true);

    const result = await tester.testConnection(buildConfig());

    expect(result).toEqual({ success: true });
  });

  it('should return success false with error message when verify() fails', async () => {
    mockTransport.verify.mockRejectedValue(new Error('Connection refused'));

    const result = await tester.testConnection(buildConfig());

    expect(result).toEqual({ success: false, error: 'Connection refused' });
  });

  it('should always close the transport after verify succeeds', async () => {
    mockTransport.verify.mockResolvedValue(true);

    await tester.testConnection(buildConfig());

    expect(mockTransport.close).toHaveBeenCalledTimes(1);
  });

  it('should always close the transport after verify fails', async () => {
    mockTransport.verify.mockRejectedValue(new Error('Timeout'));

    await tester.testConnection(buildConfig());

    expect(mockTransport.close).toHaveBeenCalledTimes(1);
  });

  it('should create transport with secure=true for ssl encryption', async () => {
    mockTransport.verify.mockResolvedValue(true);

    await tester.testConnection(buildConfig({ encryption: 'ssl' }));

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
        port: 587,
        secure: true,
        auth: { user: 'user@example.com', pass: 'secret' },
      }),
    );
  });

  it('should create transport with requireTLS=true and secure=false for tls encryption', async () => {
    mockTransport.verify.mockResolvedValue(true);

    await tester.testConnection(buildConfig({ encryption: 'tls' }));

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: 'user@example.com', pass: 'secret' },
      }),
    );
  });

  it('should create transport with secure=false and no requireTLS for none encryption', async () => {
    mockTransport.verify.mockResolvedValue(true);

    await tester.testConnection(buildConfig({ encryption: 'none' }));

    const callArgs = (nodemailer.createTransport as jest.Mock).mock.calls[0][0];
    expect(callArgs.secure).toBe(false);
    expect(callArgs.requireTLS).toBeUndefined();
  });
});
