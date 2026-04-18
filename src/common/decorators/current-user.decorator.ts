import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Interfaz del usuario inyectado por AuthGuard en request.user.
 */
export interface AuthUser {
  userId: string;
  email: string;
  role?: string;
}

/**
 * Decorador que extrae el usuario autenticado del request.
 * Evita repetir @Req() req + req.user en cada controller.
 *
 * Uso:
 *   @Get('profile')
 *   getProfile(@CurrentUser() user: AuthUser) {
 *     console.log(user.userId);
 *   }
 *
 *   // O extraer un campo específico:
 *   @Get('profile')
 *   getProfile(@CurrentUser('userId') userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser;
    return field ? user?.[field] : user;
  },
);
