import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorador para marcar endpoints que requieren un rol específico.
 *
 * Uso:
 *   @Roles('admin')
 *   @Post('products')
 *   create() { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
