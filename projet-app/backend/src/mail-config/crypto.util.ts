import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

@Injectable()
export class CryptoUtil {
  private readonly algorithm = 'aes-256-gcm' as const;
  private readonly key: Buffer;

  constructor() {
    const hexKey = process.env.ENCRYPTION_KEY;
    if (!hexKey) {
      throw new InternalServerErrorException(
        'Encryption key not configured',
      );
    }
    this.key = Buffer.from(hexKey, 'hex');
    if (this.key.length !== 32) {
      throw new InternalServerErrorException(
        'ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters)',
      );
    }
  }

  /**
   * Encrypts plaintext using AES-256-GCM.
   * @returns base64-encoded string in the format: iv:authTag:ciphertext
   */
  encrypt(plaintext: string): string {
    const iv = randomBytes(12); // 96-bit IV recommended for GCM
    const cipher = createCipheriv(this.algorithm, this.key, iv);

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:ciphertext (all concatenated then base64-encoded)
    const combined = Buffer.concat([iv, authTag, encrypted]);
    return combined.toString('base64');
  }

  /**
   * Decrypts a base64-encoded string produced by encrypt().
   * Expected format: base64(iv:authTag:ciphertext)
   */
  decrypt(encryptedBase64: string): string {
    const combined = Buffer.from(encryptedBase64, 'base64');

    // Extract components: 12 bytes IV + 16 bytes authTag + rest is ciphertext
    const iv = combined.subarray(0, 12);
    const authTag = combined.subarray(12, 28);
    const ciphertext = combined.subarray(28);

    const decipher = createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}
