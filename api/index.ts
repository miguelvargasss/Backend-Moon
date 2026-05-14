import { NestFactory } from '@nestjs/core';
import {
	INestApplication,
	Logger,
	ValidationPipe,
} from '@nestjs/common';
import { AppModule } from '../src/app.module.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';

let cachedApp: INestApplication | undefined;

async function bootstrap(): Promise<INestApplication> {
	if (cachedApp) return cachedApp;

	const app = await NestFactory.create(AppModule);

	const allowedOrigins = (process.env.FRONTEND_URL ?? '')
		.split(',')
		.map((url) => url.trim())
		.filter(Boolean);

	// Si no se configuró FRONTEND_URL, permite cualquier origen (útil para pruebas directas)
	app.enableCors({
		origin: allowedOrigins.length > 0 ? allowedOrigins : true,
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
	cachedApp = app;
	return app;
}

export default async function handler(req: any, res: any) {
	try {
		const app = await bootstrap();
		const instance = app.getHttpAdapter().getInstance();
		return instance(req, res);
	} catch (err) {
		// Evita que Vercel devuelva "FUNCTION_INVOCATION_FAILED" sin contexto
		const logger = new Logger('Vercel');
		logger.error(err);
		return res.status(500).json({
			statusCode: 500,
			message: 'Internal server error',
		});
	}
}
