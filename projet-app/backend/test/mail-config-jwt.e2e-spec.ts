import 'reflect-metadata';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { MailConfigController } from '../src/mail-config/mail-config.controller';

/**
 * Validates: Requirements 7.3, 7.4, 6.3
 *
 * Verifies that:
 * - The MailConfigController has @UseGuards(JwtAuthGuard) applied at class level
 *   (protecting ALL endpoints with JWT authentication)
 * - This ensures all /mail-config/* endpoints return 401 without valid token
 */
describe('Mail Config JWT Protection', () => {
  it('MailConfigController should have JwtAuthGuard applied at class level', () => {
    // Retrieve the guards metadata from the controller class
    const guards = Reflect.getMetadata('__guards__', MailConfigController);

    expect(guards).toBeDefined();
    expect(guards.length).toBeGreaterThan(0);

    // Verify JwtAuthGuard is one of the controller-level guards
    const hasJwtGuard = guards.some(
      (guard: any) => guard === JwtAuthGuard,
    );
    expect(hasJwtGuard).toBe(true);
  });

  it('MailConfigController should have all expected endpoints defined', () => {
    const prototype = MailConfigController.prototype;

    // Verify all endpoints exist
    expect(prototype.getSmtpConfig).toBeDefined();
    expect(prototype.saveSmtpConfig).toBeDefined();
    expect(prototype.testSmtpConnection).toBeDefined();
    expect(prototype.sendTestEmail).toBeDefined();
  });

  it('No endpoint should override the class-level guard with a public decorator', () => {
    const prototype = MailConfigController.prototype;
    const endpoints = [
      'getSmtpConfig',
      'saveSmtpConfig',
      'testSmtpConnection',
      'sendTestEmail',
    ];

    for (const method of endpoints) {
      // Check there's no IS_PUBLIC_KEY metadata that would skip the guard
      const isPublic = Reflect.getMetadata('isPublic', prototype[method]);
      expect(isPublic).not.toBe(true);
    }
  });
});
