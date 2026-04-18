/**
 * Wrapper genérico para respuestas uniformes en toda la API.
 *
 * Ejemplo de respuesta exitosa:
 *   { success: true, data: { ... }, message: 'Operación exitosa' }
 *
 * Ejemplo de respuesta con error:
 *   { success: false, data: null, message: 'Producto no encontrado' }
 */
export class ApiResponse<T = any> {
  readonly success: boolean;
  readonly data: T | null;
  readonly message: string;

  private constructor(success: boolean, data: T | null, message: string) {
    this.success = success;
    this.data = data;
    this.message = message;
  }

  static ok<T>(data: T, message = 'Operación exitosa'): ApiResponse<T> {
    return new ApiResponse(true, data, message);
  }

  static created<T>(data: T, message = 'Registro creado'): ApiResponse<T> {
    return new ApiResponse(true, data, message);
  }

  static empty(message = 'Operación completada'): ApiResponse<null> {
    return new ApiResponse(true, null, message);
  }
}
