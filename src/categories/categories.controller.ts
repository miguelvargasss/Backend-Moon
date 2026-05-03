import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ListCategoriesUseCase } from './application/list-categories.use-case.js';
import { CreateCategoryUseCase } from './application/create-category.use-case.js';
import { UpdateCategoryUseCase } from './application/update-category.use-case.js';
import { DeleteCategoryUseCase } from './application/delete-category.use-case.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { ApiResponse } from '../common/dto/api-response.dto.js';

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly listCategories: ListCategoriesUseCase,
    private readonly createCategory: CreateCategoryUseCase,
    private readonly updateCategory: UpdateCategoryUseCase,
    private readonly deleteCategory: DeleteCategoryUseCase,
  ) {}

  /** GET /categories — Lista todas las categorías (público) */
  @Get()
  async findAll() {
    const categories = await this.listCategories.execute();
    return ApiResponse.ok(categories);
  }

  /** POST /categories — Crear categoría (admin) */
  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() dto: CreateCategoryDto) {
    const category = await this.createCategory.execute(dto);
    return ApiResponse.created(category, 'Categoría creada exitosamente');
  }

  /** PATCH /categories/:id — Editar categoría (admin) */
  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    const category = await this.updateCategory.execute(id, dto);
    return ApiResponse.ok(category, 'Categoría actualizada exitosamente');
  }

  /** DELETE /categories/:id — Eliminar categoría (admin) */
  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.deleteCategory.execute(id);
    return ApiResponse.empty('Categoría eliminada exitosamente');
  }
}
