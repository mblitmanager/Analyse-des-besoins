export class SmtpDisplayDto {
  host: string;
  port: number;
  username: string;
  password: string; // '••••••••' (masqué)
  encryption: string;
  hasPassword: boolean;
}
