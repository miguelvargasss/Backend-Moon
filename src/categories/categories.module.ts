import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller.js';
import { ListCategoriesUseCase } from './application/list-categories.use-case.js';
import { CreateCategoryUseCase } from './application/create-category.use-case.js';
import { UpdateCategoryUseCase } from './application/update-category.use-case.js';
import { DeleteCategoryUseCase } from './application/delete-category.use-case.js';
import { SupabaseCategoryRepository } from './infrastructure/supabase-category.repository.js';
import { CATEGORY_REPOSITORY } from './domain/category.repository.interface.js';

@Module({
  controllers: [CategoriesController],
  providers: [
    ListCategoriesUseCase,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    { provide: CATEGORY_REPOSITORY, useClass: SupabaseCategoryRepository },
  ],
  exports: [ListCategoriesUseCase],
})
export class CategoriesModule {}
