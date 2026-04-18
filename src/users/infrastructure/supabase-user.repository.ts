import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../domain/user.repository.interface.js';
import { User } from '../domain/user.entity.js';
import { SupabaseService } from '../../supabase/supabase.service.js';
import { throwSupabaseError } from '../../common/exceptions/supabase-error.helper.js';

@Injectable()
export class SupabaseUserRepository implements IUserRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /** Mapea un registro de Supabase a la entidad de dominio User */
  private toEntity(data: Record<string, any>): User {
    return new User(
      data.IdUser,
      data.Name,
      data.LastName,
      data.email,
      data.IdRole,
    );
  }

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase.adminClient
      .from('user')
      .select('*')
      .eq('IdUser', id)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throwSupabaseError(error);
    return this.toEntity(data);
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase.adminClient
      .from('user')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throwSupabaseError(error);
    return this.toEntity(data);
  }

  async update(
    id: string,
    fields: Partial<Pick<User, 'name' | 'lastName'>>,
  ): Promise<User> {
    const payload: Record<string, string> = {};
    if (fields.name) payload['Name'] = fields.name;
    if (fields.lastName) payload['LastName'] = fields.lastName;

    const { data, error } = await this.supabase.adminClient
      .from('user')
      .update(payload)
      .eq('IdUser', id)
      .select()
      .single();

    if (error) throwSupabaseError(error);
    return this.toEntity(data);
  }
}
