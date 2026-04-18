import { Injectable, Inject } from '@nestjs/common';
import type { IProductRepository } from '../domain/product.repository.interface.js';
import { PRODUCT_REPOSITORY } from '../domain/product.repository.interface.js';
import { Product } from '../domain/product.entity.js';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(data: Omit<Product, 'id' | 'isInStock'>) {
    return this.productRepository.create(data);
  }
}
