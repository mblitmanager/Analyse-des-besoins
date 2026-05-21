import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SessionsService } from '../sessions/sessions.service';

async function bootstrap() {
  console.log('Bootstrapping NestJS application context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('Retrieving SessionsService...');
  const sessionsService = app.get(SessionsService);

  const sessionId = 'cba1db94-8bda-425c-aaec-ba390da8d326';
  console.log(`Running resendEmail for session: ${sessionId}`);
  try {
    const result = await sessionsService.resendEmail(sessionId);
    console.log('Resend email success:', result);
  } catch (error) {
    console.error('Error occurred in resendEmail:');
    console.error(error);
  } finally {
    console.log('Closing application...');
    await app.close();
  }
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
