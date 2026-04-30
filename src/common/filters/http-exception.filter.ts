import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Filtro global que captura todas las excepciones HTTP y las
 * envuelve en el formato estándar ApiResponse de la aplicación.
 *
 * Garantiza que tanto las respuestas exitosas como las de error
 * sigan la misma estructura: { success, data, message }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Extraer el mensaje de la excepción
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, any>;
        // class-validator devuelve un array en 'message'
        if (Array.isArray(responseObj.message)) {
          message = responseObj.message.join(', ');
        } else if (typeof responseObj.message === 'string') {
          message = responseObj.message;
        }
      }
    } else {
      // Error no controlado — logueamos el stack completo
      this.logger.error('Error no controlado:', exception);
    }

    response.status(status).json({
      success: false,
      data: null,
      message,
    });
  }
}
