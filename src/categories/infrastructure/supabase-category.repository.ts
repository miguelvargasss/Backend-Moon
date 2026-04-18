import { Injectable } from '@nestjs/common';
import { ICategoryRepository } from '../domain/category.repository.interface.js';
import { Category } from '../domain/category.entity.js';
import { SupabaseService } from '../../supabase/supabase.service.js';
import { throwSupabaseError } from '../../common/exceptions/supabase-error.helper.js';

@Injectable()
export class SupabaseCategoryRepository implements ICategoryRepository {
  constructor(private readonly supabase: SupabaseService) {}

  private toEntity(data: Record<string, any>): Category {
    return new Category(data.IdCategorie, data.NameCategori);
  }

  async findAll(): Promise<Category[]> {
    const { data, error } = await this.supabase.adminClient
      .from('categorie')
      .select('*');
    if (error) throwSupabaseError(error);
    return (data ?? []).map((d) => this.toEntity(d));
  }

  async findById(id: string): Promise<Category | null> {
    const { data, error } = await this.supabase.adminClient
      .from('categorie')
      .select('*')
      .eq('IdCategorie', id)
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throwSupabaseError(error);
    return this.toEntity(data);
  }
}
