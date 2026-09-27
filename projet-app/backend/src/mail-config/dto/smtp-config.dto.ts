export class SmtpConfigDto {
  host: string;
  port: number;
  username: string;
  password: string; // plaintext déchiffré
  encryption: string;
  /** The stored password exists but cannot be decrypted with ENCRYPTION_KEY. */
  passwordUnreadable?: boolean;
}
