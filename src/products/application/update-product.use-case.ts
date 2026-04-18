import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IProductRepository } from '../domain/product.repository.interface.js';
import { PRODUCT_REPOSITORY } from '../domain/product.repository.interface.js';
import { Product } from '../domain/product.entity.js';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(
    id: string,
    data: Partial<Omit<Product, 'id' | 'isInStock' | 'images'>>,
  ) {
    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Producto no encontrado');
    }
    return this.productRepository.update(id, data);
  }
}
