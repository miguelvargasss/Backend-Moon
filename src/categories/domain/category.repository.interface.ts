import { Category } from './category.entity.js';

export const CATEGORY_REPOSITORY = 'CATEGORY_REPOSITORY';

export interface ICategoryRepository {
  findAll(): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  create(data: { name: string; icon?: string }): Promise<Category>;
  update(id: string, data: { name?: string; icon?: string }): Promise<Category>;
  delete(id: string): Promise<void>;
}
