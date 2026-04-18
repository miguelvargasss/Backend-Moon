import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service.js';

/**
 * Guard JWT que valida el token Bearer contra Supabase Auth.
 * Si es válido, inyecta { userId, email } en request.user.
 *
 * Uso:
 *   @UseGuards(AuthGuard)
 *   @Get('profile')
 *   getProfile(@CurrentUser() user) { ... }
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de acceso requerido');
    }

    const token = authHeader.replace('Bearer ', '');

    const { data, error } = await this.supabase.client.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    // Inyectar datos del usuario en el request
    request.user = {
      userId: data.user.id,
      email: data.user.email,
    };

    return true;
  }
}
