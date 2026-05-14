import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let app: any;

async function bootstrap() {
  if (app) return app;

  app = await NestFactory.create(AppModule, { logger: false });

  // CORS
  const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim());
  if (allowedOrigins.includes('http://localhost:5173')) {
    allowedOrigins.push('http://localhost:5174');
  }
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();
  return app;
}

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const nestApp = await bootstrap();
    await nestApp.getHttpAdapter().getInstance()(req, res);
  } catch (error) {
    const logger = new Logger('VercelHandler');
    logger.error(error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};
