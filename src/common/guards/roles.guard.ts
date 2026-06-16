import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { SupabaseService } from '../../supabase/supabase.service.js';

/**
 * Guard que verifica si el usuario autenticado posee el rol requerido.
 * Debe usarse DESPUÉS del AuthGuard (para que request.user ya exista).
 *
 * Uso:
 *   @UseGuards(AuthGuard, RolesGuard)
 *   @Roles('admin')
 *   @Post('products')
 *   create() { ... }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabase: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no se especificó @Roles(), permitir acceso
    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    if (!userId) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Consultar el rol del usuario desde la BD
    const { data, error } = await this.supabase.adminClient
      .from('user')
      .select('role:role(nameRole)')
      .eq('IdUser', userId)
      .single();

    if (error || !data) {
      throw new ForbiddenException('No se pudo verificar el rol del usuario');
    }

    const userRole = (data.role as any)?.nameRole;

    if (!requiredRoles.includes(userRole as any)) {
      throw new ForbiddenException(
        `Acceso denegado. Se requiere rol: ${requiredRoles.join(' o ')}`,
      );
    }

    // Inyectar el rol en request.user para uso posterior
    request.user.role = userRole;

    return true;
  }
}
