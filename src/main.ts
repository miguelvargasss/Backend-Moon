import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

let cachedApp: INestApplication;

async function bootstrap(): Promise<INestApplication> {
  if (cachedApp) return cachedApp;

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
      whitelist: true, // elimina campos no declarados en el DTO
      transform: true, // transforma tipos automáticamente
      forbidNonWhitelisted: true, // lanza error si llegan campos no permitidos
    }),
  );

  await app.init();
  cachedApp = app;
  return app;
}

// Ejecución local
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  bootstrap()
    .then(async (app) => {
      const port = process.env.PORT ?? 3000;
      await app.listen(port);
      new Logger('Bootstrap').log(
        `🚀 Backend MoonPhases corriendo en: http://localhost:${port}`,
      );
    })
    .catch((err: unknown) => {
      new Logger('Bootstrap').error('Error al iniciar la aplicación', err);
      process.exit(1);
    });
}

// Exportar para Vercel
export default async (req: any, res: any) => {
  const app = await bootstrap();
  const instance = app.getHttpAdapter().getInstance();
  instance(req, res);
};
