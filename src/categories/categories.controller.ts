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
import { GetSizeSystemsUseCase } from '../products/application/get-size-systems.use-case.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { CreateSizeSystemDto, CreateSizeOptionDto } from '../products/dto/size-system.dto.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { ApiResponse } from '../common/dto/api-response.dto.js';
import type { IProductRepository } from '../products/domain/product.repository.interface.js';
import { PRODUCT_REPOSITORY } from '../products/domain/product.repository.interface.js';
import { Inject } from '@nestjs/common';

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly listCategories: ListCategoriesUseCase,
    private readonly createCategory: CreateCategoryUseCase,
    private readonly updateCategory: UpdateCategoryUseCase,
    private readonly deleteCategory: DeleteCategoryUseCase,
    private readonly getSizeSystems: GetSizeSystemsUseCase,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  // ── Categorías ──────────────────────────────────

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

  // ── Sistemas de Tallas ──────────────────────────

  /** GET /categories/size-systems — Lista todos los sistemas de tallas */
  @Get('size-systems')
  async findSizeSystems() {
    const systems = await this.getSizeSystems.execute();
    return ApiResponse.ok(systems);
  }

  /** POST /categories/size-systems — Crear sistema de tallas (admin) */
  @Post('size-systems')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async createSizeSystem(@Body() dto: CreateSizeSystemDto) {
    const system = await this.productRepository.createSizeSystem(dto.name);
    return ApiResponse.created(system, 'Sistema de tallas creado exitosamente');
  }

  /** PATCH /categories/size-systems/:id — Editar sistema de tallas (admin) */
  @Patch('size-systems/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async updateSizeSystem(
    @Param('id') id: string,
    @Body() dto: CreateSizeSystemDto,
  ) {
    const system = await this.productRepository.updateSizeSystem(id, dto.name);
    return ApiResponse.ok(system, 'Sistema de tallas actualizado exitosamente');
  }

  /** DELETE /categories/size-systems/:id — Eliminar sistema de tallas (admin) */
  @Delete('size-systems/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async removeSizeSystem(@Param('id') id: string) {
    await this.productRepository.deleteSizeSystem(id);
    return ApiResponse.empty('Sistema de tallas eliminado exitosamente');
  }

  /** POST /categories/size-systems/:id/options — Agregar opción de talla (admin) */
  @Post('size-systems/:id/options')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async addSizeOption(
    @Param('id') systemId: string,
    @Body() dto: CreateSizeOptionDto,
  ) {
    const option = await this.productRepository.addSizeOption(
      systemId,
      dto.label,
      dto.sortOrder,
    );
    return ApiResponse.created(option, 'Opción de talla agregada exitosamente');
  }

  /** DELETE /categories/size-systems/:id/options/:optionId — Eliminar opción (admin) */
  @Delete('size-systems/:id/options/:optionId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async removeSizeOption(@Param('optionId') optionId: string) {
    await this.productRepository.deleteSizeOption(optionId);
    return ApiResponse.empty('Opción de talla eliminada exitosamente');
  }
}
