import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ICategoryRepository } from '../domain/category.repository.interface.js';
import { CATEGORY_REPOSITORY } from '../domain/category.repository.interface.js';

@Injectable()
export class DeleteCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}


  // esta seccion es para eliminar una categoria
  async execute(id: string): Promise<void> {
    const existing = await this.categoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Categoría no encontrada');
    }
    await this.categoryRepository.delete(id);
  }
}
