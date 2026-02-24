import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL') || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Expose all API routes under /api so frontend can call /api/* without CORS issues
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('WiziLearn API')
    .setDescription("Documentation technique de l'API WiziLearn (AOPIA/LIKE)")
    .setVersion('1.0')
    .addTag('auth', 'Authentification')
    .addTag('formations', 'Catalogue de formations')
    .addTag('questions', 'Gestion des questions et workflow')
    .addTag('sessions', "Sessions d'évaluation")
    .addTag('contacts', 'Conseillers et formateurs')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
