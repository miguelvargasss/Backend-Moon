import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service.js';

@Global() // disponible en toda la app sin necesidad de importarlo en cada módulo
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
