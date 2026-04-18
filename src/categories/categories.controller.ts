import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ListCategoriesUseCase } from './application/list-categories.use-case.js';
import { ApiResponse } from '../common/dto/api-response.dto.js';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly listCategories: ListCategoriesUseCase) {}

  /** GET /categories — Lista todas las categorías (público) */
  @Get()
  async findAll() {
    const categories = await this.listCategories.execute();
    return ApiResponse.ok(categories);
  }
}
