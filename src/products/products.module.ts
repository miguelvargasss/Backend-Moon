import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller.js';
import { CreateProductUseCase } from './application/create-product.use-case.js';
import { GetProductUseCase } from './application/get-product.use-case.js';
import { ListProductsUseCase } from './application/list-products.use-case.js';
import { UpdateProductUseCase } from './application/update-product.use-case.js';
import { DeleteProductUseCase } from './application/delete-product.use-case.js';
import { UploadProductImagesUseCase } from './application/upload-product-images.use-case.js';
import { DeleteProductImageUseCase } from './application/delete-product-image.use-case.js';
import { SupabaseProductRepository } from './infrastructure/supabase-product.repository.js';
import { PRODUCT_REPOSITORY } from './domain/product.repository.interface.js';

@Module({
  controllers: [ProductsController],
  providers: [
    CreateProductUseCase,
    GetProductUseCase,
    ListProductsUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    UploadProductImagesUseCase,
    DeleteProductImageUseCase,
    { provide: PRODUCT_REPOSITORY, useClass: SupabaseProductRepository },
  ],
  exports: [
    GetProductUseCase,
    ListProductsUseCase,
    { provide: PRODUCT_REPOSITORY, useClass: SupabaseProductRepository },
  ],
})
export class ProductsModule {}
