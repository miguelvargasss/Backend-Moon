import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { IAuthRepository } from '../domain/auth.repository.interface.js';
import { SupabaseService } from '../../supabase/supabase.service.js';

@Injectable()
export class SupabaseAuthRepository implements IAuthRepository {
  private readonly logger = new Logger(SupabaseAuthRepository.name);

  constructor(private readonly supabase: SupabaseService) {}

  async login(email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    // Obtener perfil del usuario con su rol desde la BD
    const { data: profile, error: profileError } =
      await this.supabase.adminClient
        .from('user')
        .select('IdUser, Name, LastName, email, role:role(nameRole)')
        .eq('IdUser', data.user.id)
        .single();

    if (profileError || !profile) {
      this.logger.warn(`Usuario autenticado sin perfil en BD: ${data.user.id}`);
      throw new UnauthorizedException(
        'Perfil de usuario no encontrado. Contacte al administrador.',
      );
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: profile.IdUser,
        email: profile.email,
        name: profile.Name,
        lastName: profile.LastName,
        role: (profile.role as any)?.nameRole ?? 'comprador',
      },
    };
  }

  async register(
    email: string,
    password: string,
    metadata: { Name: string; LastName: string },
    role?: string,
  ) {
    // 1. Verificar si el email ya existe en la tabla 'user' (detección temprana)
    const { data: existingProfile } = await this.supabase.adminClient
      .from('user')
      .select('IdUser')
      .eq('email', email)
      .maybeSingle();

    if (existingProfile) {
      throw new ConflictException('Este email ya está registrado');
    }

    // 2. Crear usuario con Admin API (service_role key)
    //    - Bypassa restricciones de email confirmation, rate limiting, etc.
    //    - email_confirm: true → usuario queda confirmado inmediatamente
    const { data, error } =
      await this.supabase.adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: metadata,
      });

    if (error) {
      this.logger.error(
        `Admin createUser error: ${error.message} (status: ${error.status})`,
      );

      if (
        error.message.includes('already been registered') ||
        error.message.includes('already exists')
      ) {
        throw new ConflictException('Este email ya está registrado');
      }
      if (error.message.includes('password')) {
        throw new BadRequestException(
          'La contraseña no cumple los requisitos mínimos (mínimo 6 caracteres)',
        );
      }
      throw new InternalServerErrorException(
        'Error al crear la cuenta. Intenta de nuevo más tarde.',
      );
    }

    const userId = data.user.id;

    try {
      // 3. Obtener el IdRole del rol solicitado (por defecto 'comprador')
      const roleName = role ?? 'comprador';
      const { data: roleData, error: roleError } =
        await this.supabase.adminClient
          .from('role')
          .select('IdRole')
          .eq('nameRole', roleName)
          .single();

      if (roleError || !roleData) {
        throw new InternalServerErrorException(
          `No se encontró el rol '${roleName}' en la base de datos`,
        );
      }

      // 4. Crear/actualizar registro en tabla 'user'
      //    Usamos upsert porque puede existir un trigger en auth.users
      //    que auto-inserta un registro en 'user' al crear el usuario en Auth.
      //    upsert actualiza si ya existe, inserta si no.
      const { error: userError } = await this.supabase.adminClient
        .from('user')
        .upsert(
          {
            IdUser: userId,
            Name: metadata.Name,
            LastName: metadata.LastName,
            email: email,
            IdRole: roleData.IdRole,
          },
          { onConflict: 'IdUser' },
        );

      if (userError) {
        this.logger.error(
          `Error al crear perfil de usuario: ${userError.message}`,
        );
        throw new InternalServerErrorException(
          'Error al crear el perfil del usuario',
        );
      }

      // 5. Inicializar puntos del usuario en 0
      const { error: pintsError } = await this.supabase.adminClient
        .from('pints_user')
        .upsert(
          {
            IdUser: userId,
            points: 0,
          },
          { onConflict: 'IdUser' },
        );

      if (pintsError) {
        // Log pero no falla el registro — los puntos se pueden inicializar después
        this.logger.warn(
          `No se pudieron inicializar puntos para usuario ${userId}: ${pintsError.message}`,
        );
      }
    } catch (err) {
      // Si falla la creación del perfil, eliminar el usuario de Auth
      // para no dejar usuarios huérfanos
      this.logger.error(`Rollback: eliminando usuario de Auth ${userId}`);
      await this.supabase.adminClient.auth.admin.deleteUser(userId);
      throw err;
    }

    return { userId };
  }

  async logout(accessToken: string) {
    // Obtener el usuario a partir del token para cerrar su sesión específica
    const { data: userData } =
      await this.supabase.client.auth.getUser(accessToken);

    if (userData?.user) {
      // Usar admin API para cerrar sesión del usuario específico
      // scope: 'global' cierra todas las sesiones activas del usuario
      await this.supabase.adminClient.auth.admin.signOut(
        userData.user.id,
        'global',
      );
    }
  }

  async refreshSession(refreshToken: string) {
    const { data, error } = await this.supabase.client.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new UnauthorizedException('Token de refresco inválido o expirado');
    }

    return { accessToken: data.session!.access_token };
  }
}
