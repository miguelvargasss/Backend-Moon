import { Injectable, Inject } from '@nestjs/common';
import type { ICategoryRepository } from '../domain/category.repository.interface.js';
import { CATEGORY_REPOSITORY } from '../domain/category.repository.interface.js';

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(data: { name: string; icon?: string }) {
    return this.categoryRepository.create(data);
  }
}
