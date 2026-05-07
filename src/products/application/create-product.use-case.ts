import { Injectable, Inject } from '@nestjs/common';
import type { IProductRepository } from '../domain/product.repository.interface.js';
import { PRODUCT_REPOSITORY } from '../domain/product.repository.interface.js';
import type { CreateVariantDto } from '../dto/create-product.dto.js';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(data: {
    name: string;
    price: number;
    description?: string;
    specification?: string;
    sizeType?: string;
    categoryId?: string;
    variants?: CreateVariantDto[];
  }) {
    // 1. Crear el producto base
    const product = await this.productRepository.create({
      name: data.name,
      price: data.price,
      description: data.description,
      specification: data.specification,
      sizeType: data.sizeType,
      categoryId: data.categoryId,
    });

    // 2. Crear variantes si se proporcionaron
    if (data.variants && data.variants.length > 0) {
      for (const variant of data.variants) {
        await this.productRepository.createVariant(product.id, {
          size: variant.size,
          color: variant.color,
          stock: variant.stock,
          priceOverride: variant.priceOverride,
        });
      }
    }

    // 3. Retornar el producto completo con variantes
    return this.productRepository.findById(product.id);
  }
}
