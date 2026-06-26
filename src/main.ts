import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

function getAllowedOrigins(): string[] {
  const origins = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim());
  if (origins.includes('http://localhost:5173')) {
    origins.push('http://localhost:5174');
  }
  return origins;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: getAllowedOrigins(),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Filtro global — respuestas de error uniformes en formato ApiResponse
  app.useGlobalFilters(new HttpExceptionFilter());

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina campos no declarados en el DTO
      transform: true, // transforma tipos automáticamente
      forbidNonWhitelisted: true, // lanza error si llegan campos no permitidos
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0'); // Render requiere escuchar en 0.0.0.0
  new Logger('Bootstrap').log(
    `🚀 Backend MoonPhases corriendo en: http://localhost:${port}`,
  );
}

bootstrap().catch((err: unknown) => {
  new Logger('Bootstrap').error('Error al iniciar la aplicación', err);
  process.exit(1);
});
