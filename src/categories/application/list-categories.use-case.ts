import { Injectable, Inject } from '@nestjs/common';
import type { ICategoryRepository } from '../domain/category.repository.interface.js';
import { CATEGORY_REPOSITORY } from '../domain/category.repository.interface.js';

@Injectable()
export class ListCategoriesUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute() {
    return this.categoryRepository.findAll();
  }
}
