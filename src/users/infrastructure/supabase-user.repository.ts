import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../domain/user.repository.interface.js';
import { User } from '../domain/user.entity.js';
import { SupabaseService } from '../../supabase/supabase.service.js';
import { throwSupabaseError } from '../../common/exceptions/supabase-error.helper.js';

@Injectable()
export class SupabaseUserRepository implements IUserRepository {
  constructor(private readonly supabase: SupabaseService) {}

  private toEntity(data: Record<string, any>): User {
    // pints_user puede venir como objeto o array según el join de Supabase
    const pintsRel = Array.isArray(data.pints_user)
      ? data.pints_user[0]
      : data.pints_user;
    const points = pintsRel ? Number(pintsRel.points) : undefined;

    // role puede venir como objeto o array según el join
    const roleRel = Array.isArray(data.role) ? data.role[0] : data.role;
    const roleName = roleRel?.nameRole ?? undefined;

    return new User(
      data.IdUser,
      data.Name,
      data.LastName,
      data.email,
      data.IdRole,
      points,
      roleName,
      data.created_at ?? undefined,
    );
  }

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase.adminClient
      .from('user')
      .select('*, pints_user(points)')
      .eq('IdUser', id)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throwSupabaseError(error);
    return this.toEntity(data);
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase.adminClient
      .from('user')
      .select('*, pints_user(points)')
      .eq('email', email)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throwSupabaseError(error);
    return this.toEntity(data);
  }

  async findAll(): Promise<User[]> {
    const { data, error } = await this.supabase.adminClient
      .from('user')
      .select('*, role(nameRole), pints_user(points)')
      .order('Name', { ascending: true });

    if (error) throwSupabaseError(error);

    const users = (data ?? []).map((d) => this.toEntity(d));

    // Enriquecer con created_at de auth.users
    try {
      const { data: authData } =
        await this.supabase.adminClient.auth.admin.listUsers();
      if (authData?.users) {
        const authMap = new Map<string, string>(
          authData.users.map((u) => [u.id, u.created_at] as [string, string]),
        );
        return users.map(
          (u) =>
            new User(
              u.id,
              u.name,
              u.lastName,
              u.email,
              u.roleId,
              u.points,
              u.roleName,
              authMap.get(u.id) ?? undefined,
            ),
        );
      }
    } catch {
      // Si falla la consulta de auth, devolvemos sin created_at
    }

    return users;
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

  async addPoints(userId: string, points: number): Promise<number> {
    // Usar limit(1) en lugar de maybeSingle() para tolerar filas duplicadas
    // sin lanzar error — maybeSingle lanza si hay >1 fila, lo que silenciaba el fallo
    const { data: rows, error: readErr } = await this.supabase.adminClient
      .from('pints_user')
      .select('IdPointsUser, points')
      .eq('IdUser', userId)
      .order('points', { ascending: false })
      .limit(1);

    if (readErr) throwSupabaseError(readErr);

    const current = rows?.[0] ?? null;
    const currentPoints = Number(current?.points ?? 0);
    const newTotal = Math.max(0, currentPoints + points);

    if (current?.IdPointsUser) {
      // Fila existente — actualizar directamente por PK
      const { error: updateErr } = await this.supabase.adminClient
        .from('pints_user')
        .update({ points: newTotal })
        .eq('IdPointsUser', current.IdPointsUser);
      if (updateErr) throwSupabaseError(updateErr);
    } else {
      // Sin fila — upsert con onConflict para evitar race condition
      const { error: upsertErr } = await this.supabase.adminClient
        .from('pints_user')
        .upsert({ IdUser: userId, points: newTotal }, { onConflict: 'IdUser' });
      if (upsertErr) throwSupabaseError(upsertErr);
    }

    return newTotal;
  }
}
