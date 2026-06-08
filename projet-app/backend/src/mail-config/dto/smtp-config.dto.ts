export class SmtpConfigDto {
  host: string;
  port: number;
  username: string;
  password: string; // plaintext déchiffré
  encryption: string;
}
