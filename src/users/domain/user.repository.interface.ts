import { User } from './user.entity.js';

// Injection token para el repositorio (Dependency Inversion Principle)
export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  update(
    id: string,
    data: Partial<Pick<User, 'name' | 'lastName'>>,
  ): Promise<User>;

  /** Suma puntos al usuario (programa de fidelización MoonPoints). */
  addPoints(userId: string, points: number): Promise<number>;
}
