import { Injectable, Inject } from '@nestjs/common';
import type { IProductRepository } from '../domain/product.repository.interface.js';
import { PRODUCT_REPOSITORY } from '../domain/product.repository.interface.js';

@Injectable()
export class GetProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(id: string) {
    return this.productRepository.findById(id);
  }
}
