import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ICategoryRepository } from '../domain/category.repository.interface.js';
import { CATEGORY_REPOSITORY } from '../domain/category.repository.interface.js';

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(id: string, data: { name?: string; icon?: string }) {
    const existing = await this.categoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Categoría no encontrada');
    }
    return this.categoryRepository.update(id, data);
  }
}
