import { Injectable, Inject } from '@nestjs/common';
import type { IProductRepository } from '../domain/product.repository.interface.js';
import { PRODUCT_REPOSITORY } from '../domain/product.repository.interface.js';

@Injectable()
export class GetSizeSystemsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute() {
    return this.productRepository.getSizeSystems();
  }
}
