import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // CORS — permite comunicación con el frontend
  const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim());
  // Also allow 5174 in development (Vite picks next available port)
  if (allowedOrigins.includes('http://localhost:5173')) {
    allowedOrigins.push('http://localhost:5174');
  }
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Filtro global — respuestas de error uniformes en formato ApiResponse
  app.useGlobalFilters(new HttpExceptionFilter());

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // elimina campos no declarados en el DTO
      transform: true,           // transforma tipos automáticamente
      forbidNonWhitelisted: true, // lanza error si llegan campos no permitidos
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`🚀 Backend MoonPhases corriendo en: http://localhost:${port}`);
}
bootstrap();

