import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IProductRepository } from '../domain/product.repository.interface.js';
import { PRODUCT_REPOSITORY } from '../domain/product.repository.interface.js';

@Injectable()
export class DeleteProductImageUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(productId: string, imageId: string): Promise<void> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    await this.productRepository.removeImage(imageId);
  }
}
