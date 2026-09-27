import { ConfigService } from '@nestjs/config';

const DEV_FALLBACK_SECRET = 'dev-only-insecure-jwt-secret';

export function getJwtSecret(configService: ConfigService): string {
  const secret = configService.get<string>('JWT_SECRET');
  if (secret) return secret;
  if (configService.get<string>('NODE_ENV') === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return DEV_FALLBACK_SECRET;
}
