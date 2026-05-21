import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateProductUseCase } from './application/create-product.use-case.js';
import { GetProductUseCase } from './application/get-product.use-case.js';
import { ListProductsUseCase } from './application/list-products.use-case.js';
import { UpdateProductUseCase } from './application/update-product.use-case.js';
import { DeleteProductUseCase } from './application/delete-product.use-case.js';
import { GetProductStatusesUseCase } from './application/get-product-statuses.use-case.js';
import { GetSizeSystemsUseCase } from './application/get-size-systems.use-case.js';
import { UploadProductImagesUseCase } from './application/upload-product-images.use-case.js';
import { DeleteProductImageUseCase } from './application/delete-product-image.use-case.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { FilterProductsDto } from './dto/filter-products.dto.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { ApiResponse } from '../common/dto/api-response.dto.js';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly getProduct: GetProductUseCase,
    private readonly listProducts: ListProductsUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly deleteProduct: DeleteProductUseCase,
    private readonly getProductStatuses: GetProductStatusesUseCase,
    private readonly getSizeSystems: GetSizeSystemsUseCase,
    private readonly uploadImages: UploadProductImagesUseCase,
    private readonly deleteImage: DeleteProductImageUseCase,
  ) {}

  /** GET /products — Catálogo público con filtros opcionales */
  @Get()
  async findAll(@Query() filters: FilterProductsDto) {
    const products = await this.listProducts.execute(filters);
    return ApiResponse.ok(products);
  }

  /** GET /products/statuses — Obtener lista de estados posibles */
  @Get('statuses')
  async getStatuses() {
    const statuses = await this.getProductStatuses.execute();
    return ApiResponse.ok(statuses);
  }

  /** GET /products/size-systems — Obtener catálogos de tallas */
  @Get('size-systems')
  async findSizeSystems() {
    const systems = await this.getSizeSystems.execute();
    return ApiResponse.ok(systems);
  }

  /** GET /products/:id — Detalle de producto con imágenes */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const product = await this.getProduct.execute(id);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    return ApiResponse.ok(product);
  }

  /** POST /products — Crear producto (admin) */
  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() dto: CreateProductDto) {
    console.log(
      '📦 [CREATE PRODUCT] DTO recibido:',
      JSON.stringify(dto, null, 2),
    );
    const product = await this.createProduct.execute(dto);
    return ApiResponse.created(product, 'Producto creado exitosamente');
  }

  /** PATCH /products/:id — Editar producto (admin) */
  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    const product = await this.updateProduct.execute(id, dto as any);
    return ApiResponse.ok(product, 'Producto actualizado exitosamente');
  }

  /** DELETE /products/:id — Eliminar/desactivar producto (admin, CU04) */
  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string) {
    const result = await this.deleteProduct.execute(id);
    const message =
      result.action === 'deactivated'
        ? 'Producto desactivado (tiene historial de ventas)'
        : 'Producto eliminado exitosamente';
    return ApiResponse.ok(result, message);
  }

  /** POST /products/:id/images — Subir imagen (admin) */
  @Post(':id/images')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('styleId') styleId?: string,
  ) {
    const image = await this.uploadImages.execute(id, file, styleId);
    return ApiResponse.created(image, 'Imagen subida exitosamente');
  }

  /** DELETE /products/:id/images/:imageId — Eliminar imagen (admin) */
  @Delete(':id/images/:imageId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async removeImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    await this.deleteImage.execute(id, imageId);
    return ApiResponse.empty('Imagen eliminada exitosamente');
  }
}
