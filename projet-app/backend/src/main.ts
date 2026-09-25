import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
// import { LoggerService } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  // const logger = app.get(LoggerService);

  // Use custom logger
  // app.useLogger(logger);
  // logger.log('Application starting...', 'Bootstrap');
  console.log('Application starting...');

  const allowedOrigins = [
    configService.get<string>('FRONTEND_URL'),
    'https://ns-conseil-ab.mbl-service.com',
  ].filter(Boolean) as string[];

  const isProd =
    configService.get<string>('NODE_ENV') === 'production' ||
    process.env.NODE_ENV === 'production';
  const isOriginAllowed = (origin?: string) =>
    !origin || (!isProd && origin.includes('localhost')) || allowedOrigins.includes(origin);

  // Security headers with Helmet (TODO: uncomment after installing helmet package)
  // app.use(helmet({
  //   contentSecurityPolicy: {
  //     directives: {
  //       defaultSrc: ["'self'"],
  //       styleSrc: ["'self'", "'unsafe-inline'"],
  //       scriptSrc: ["'self'"],
  //       imgSrc: ["'self'", "data:", "https:"],
  //     },
  //   },
  //   crossOriginEmbedderPolicy: false,
  // }));

  // Cache headers for static content
  app.use((req, res, next) => {
    // Cache static assets for 1 year
    if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    else if (
      /^\/api\/(formations|questions)(\/|$)/.test(req.path) &&
      req.method === 'GET' &&
      !req.headers.authorization &&
      !req.headers.cookie
    ) {
      res.setHeader('Cache-Control', 'public, max-age=300');
    }
    // No cache for dynamic content
    else {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    next();
  });

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (isOriginAllowed(origin)) return next();
    console.warn('CORS blocked for origin:', origin);
    return res.status(403).json({
      statusCode: 403,
      message: 'CORS policy: Origin not allowed',
    });
  });

  app.enableCors({
    origin: (origin, callback) => {
      return callback(null, isOriginAllowed(origin));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Expose all API routes under /api so frontend can call /api/* without CORS issues
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Analyses des Besoins API')
    .setDescription("Documentation technique de l'API AB (AOPIA/LIKE)")
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

  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
