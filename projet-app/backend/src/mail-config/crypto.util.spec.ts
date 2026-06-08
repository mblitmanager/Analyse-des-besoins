import { InternalServerErrorException } from '@nestjs/common';
import { CryptoUtil } from './crypto.util';

describe('CryptoUtil', () => {
  const VALID_KEY_HEX =
    'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';

  let cryptoUtil: CryptoUtil;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = VALID_KEY_HEX;
    cryptoUtil = new CryptoUtil();
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  describe('constructor', () => {
    it('should throw if ENCRYPTION_KEY is not set', () => {
      delete process.env.ENCRYPTION_KEY;
      expect(() => new CryptoUtil()).toThrow(InternalServerErrorException);
      expect(() => new CryptoUtil()).toThrow('Encryption key not configured');
    });

    it('should throw if ENCRYPTION_KEY is not 32 bytes', () => {
      process.env.ENCRYPTION_KEY = 'abcd1234'; // too short
      expect(() => new CryptoUtil()).toThrow(InternalServerErrorException);
      expect(() => new CryptoUtil()).toThrow(
        'ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters)',
      );
    });

    it('should initialize successfully with a valid 32-byte hex key', () => {
      expect(() => new CryptoUtil()).not.toThrow();
    });
  });

  describe('encrypt', () => {
    it('should return a base64 string different from the plaintext', () => {
      const plaintext = 'my-secret-password';
      const encrypted = cryptoUtil.encrypt(plaintext);

      expect(encrypted).not.toBe(plaintext);
      // Verify it's valid base64
      expect(() => Buffer.from(encrypted, 'base64')).not.toThrow();
    });

    it('should produce different ciphertexts for the same input (random IV)', () => {
      const plaintext = 'same-password';
      const encrypted1 = cryptoUtil.encrypt(plaintext);
      const encrypted2 = cryptoUtil.encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should produce output with correct structure (iv + authTag + ciphertext)', () => {
      const plaintext = 'hello';
      const encrypted = cryptoUtil.encrypt(plaintext);
      const decoded = Buffer.from(encrypted, 'base64');

      // Minimum size: 12 (IV) + 16 (authTag) + 1 (at least 1 byte ciphertext)
      expect(decoded.length).toBeGreaterThanOrEqual(29);
    });
  });

  describe('decrypt', () => {
    it('should return the original plaintext after encrypt/decrypt round-trip', () => {
      const plaintext = 'my-secret-smtp-password!@#$%';
      const encrypted = cryptoUtil.encrypt(plaintext);
      const decrypted = cryptoUtil.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle empty string', () => {
      const plaintext = '';
      const encrypted = cryptoUtil.encrypt(plaintext);
      const decrypted = cryptoUtil.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', () => {
      const plaintext = 'mot-de-passe-éàü-中文-🔐';
      const encrypted = cryptoUtil.encrypt(plaintext);
      const decrypted = cryptoUtil.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle long strings', () => {
      const plaintext = 'x'.repeat(10000);
      const encrypted = cryptoUtil.encrypt(plaintext);
      const decrypted = cryptoUtil.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw on tampered ciphertext', () => {
      const plaintext = 'secret';
      const encrypted = cryptoUtil.encrypt(plaintext);
      const decoded = Buffer.from(encrypted, 'base64');

      // Tamper with the ciphertext portion
      decoded[decoded.length - 1] ^= 0xff;
      const tampered = decoded.toString('base64');

      expect(() => cryptoUtil.decrypt(tampered)).toThrow();
    });

    it('should throw on invalid base64 input', () => {
      expect(() => cryptoUtil.decrypt('not-valid-base64!!!')).toThrow();
    });
  });
});
