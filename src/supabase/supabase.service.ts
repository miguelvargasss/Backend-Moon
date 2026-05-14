import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);

  // Cliente con anon key — para operaciones del lado del usuario (respeta RLS)
  private readonly _client: SupabaseClient;

  // Cliente con service_role key — para operaciones del servidor (bypassa RLS)
  private readonly _adminClient: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.getOrThrow<string>('SUPABASE_URL');
    const anonKey = this.configService.getOrThrow<string>('SUPABASE_ANON_KEY');
    const serviceRoleKey = this.configService.getOrThrow<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    // Cliente anon — para operaciones que respetan las políticas RLS
    this._client = createClient(url, anonKey);

    // Cliente admin — para operaciones del backend con privilegios completos
    // autoRefreshToken y persistSession se deshabilitan porque el backend
    // no necesita mantener sesiones entre requests
    this._adminClient = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  onModuleInit() {
    this.logger.log('Supabase conectado correctamente');
    this.logger.log(`URL: ${this.configService.get<string>('SUPABASE_URL')}`);
  }

  /**
   * Cliente Supabase con anon key.
   * Úsalo cuando necesites operar en nombre del usuario autenticado.
   * Las políticas RLS se aplican según el JWT del usuario.
   */
  get client(): SupabaseClient {
    return this._client;
  }

  /**
   * Cliente Supabase Admin con service_role key.
   * Úsalo en operaciones del servidor que requieren acceso completo
   * (ej: crear usuarios, operaciones admin, bypassar RLS).
   * ¡NUNCA expongas este cliente al frontend!
   */
  get adminClient(): SupabaseClient {
    return this._adminClient;
  }
}
