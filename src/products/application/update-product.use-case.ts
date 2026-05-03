import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IProductRepository, CreateProductData } from '../domain/product.repository.interface.js';
import { PRODUCT_REPOSITORY } from '../domain/product.repository.interface.js';
import type { CreateVariantDto } from '../dto/create-product.dto.js';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(
    id: string,
    data: Partial<CreateProductData> & { variants?: CreateVariantDto[] },
  ) {
    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Producto no encontrado');
    }

    // 1. Actualizar datos base del producto
    const { variants, ...productData } = data;
    await this.productRepository.update(id, productData);

    // 2. Si se enviaron variantes, reemplazar todas (delete + recreate)
    if (variants !== undefined) {
      await this.productRepository.deleteAllVariants(id);
      for (const variant of variants) {
        await this.productRepository.createVariant(id, {
          size: variant.size,
          color: variant.color,
          stock: variant.stock,
          priceOverride: variant.priceOverride,
        });
      }
    }

    // 3. Retornar producto completo
    return this.productRepository.findById(id);
  }
}
