import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller.js';
import { ListCategoriesUseCase } from './application/list-categories.use-case.js';
import { SupabaseCategoryRepository } from './infrastructure/supabase-category.repository.js';
import { CATEGORY_REPOSITORY } from './domain/category.repository.interface.js';

@Module({
  controllers: [CategoriesController],
  providers: [
    ListCategoriesUseCase,
    { provide: CATEGORY_REPOSITORY, useClass: SupabaseCategoryRepository },
  ],
  exports: [ListCategoriesUseCase],
})
export class CategoriesModule {}
