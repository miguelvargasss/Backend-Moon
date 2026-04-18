import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { IAuthRepository } from '../domain/auth.repository.interface.js';
import { SupabaseService } from '../../supabase/supabase.service.js';

@Injectable()
export class SupabaseAuthRepository implements IAuthRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async login(email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    return {
      accessToken: data.session!.access_token,
      refreshToken: data.session!.refresh_token,
    };
  }

  async register(
    email: string,
    password: string,
    metadata: { Name: string; LastName: string },
  ) {
    const { data, error } = await this.supabase.client.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        throw new ConflictException('Este email ya está registrado');
      }
      throw new ConflictException(error.message);
    }

    return { userId: data.user!.id };
  }

  async logout(accessToken: string) {
    // Supabase Auth signOut cierra la sesión del usuario actual
    await this.supabase.client.auth.signOut();
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
