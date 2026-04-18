import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

/**
 * Traduce errores de Supabase/PostgreSQL a excepciones HTTP de NestJS.
 * Centraliza el manejo de errores para evitar `throw new Error()` en cada repositorio.
 *
 * Códigos PostgreSQL comunes:
 *   23505 = unique_violation
 *   23503 = foreign_key_violation
 *   PGRST116 = row not found (PostgREST)
 */
export function throwSupabaseError(error: { code?: string; message: string }): never {
  switch (error.code) {
    case '23505':
      throw new ConflictException(
        `El registro ya existe: ${error.message}`,
      );

    case '23503':
      throw new BadRequestException(
        `Referencia inválida: ${error.message}`,
      );

    case 'PGRST116':
      throw new NotFoundException('Registro no encontrado');

    default:
      throw new InternalServerErrorException(
        `Error de base de datos: ${error.message}`,
      );
  }
}
