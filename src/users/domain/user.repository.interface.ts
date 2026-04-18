import { User } from './user.entity.js';

// Injection token para el repositorio (Dependency Inversion Principle)
export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(id: string, data: Partial<Pick<User, 'name' | 'lastName'>>): Promise<User>;
}
