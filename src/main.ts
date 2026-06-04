import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

let cachedApp: INestApplication;

function getAllowedOrigins(): string[] {
  const origins = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim());
  if (origins.includes('http://localhost:5173')) {
    origins.push('http://localhost:5174');
  }
  return origins;
}

async function bootstrap(): Promise<INestApplication> {
  if (cachedApp) return cachedApp;

  const app = await NestFactory.create(AppModule);

  // CORS — en Vercel se maneja directamente en el handler exportado
  // En local (no-Vercel) lo gestiona NestJS normalmente
  if (!process.env.VERCEL) {
    app.enableCors({
      origin: getAllowedOrigins(),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    });
  }

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

// Ejecución del servidor
if (!process.env.VERCEL) {
  bootstrap()
    .then(async (app) => {
      const port = process.env.PORT ?? 3000;
      await app.listen(port, '0.0.0.0'); // Render requiere escuchar en 0.0.0.0
      new Logger('Bootstrap').log(
        `🚀 Backend MoonPhases corriendo en: http://0.0.0.0:${port}`,
      );
    })
    .catch((err: unknown) => {
      new Logger('Bootstrap').error('Error al iniciar la aplicación', err);
      process.exit(1);
    });
}

// Exportar para Vercel — CORS se maneja aquí directamente
export default async (req: any, res: any) => {
  const origin: string | undefined = req.headers['origin'];
  const allowedOrigins = getAllowedOrigins();

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization',
    );
  }

  // Preflight OPTIONS — responder directamente sin pasar por NestJS
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const app = await bootstrap();
  const instance = app.getHttpAdapter().getInstance();
  instance(req, res);
};
