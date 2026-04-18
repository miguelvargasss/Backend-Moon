import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import type { ICartRepository } from '../domain/cart.repository.interface.js';
import { CART_REPOSITORY } from '../domain/cart.repository.interface.js';
import type { IProductRepository } from '../../products/domain/product.repository.interface.js';
import { PRODUCT_REPOSITORY } from '../../products/domain/product.repository.interface.js';

/**
 * CU02 — Agregar producto al carrito.
 * Verifica stock, merge de duplicados.
 */
@Injectable()
export class AddToCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepository: ICartRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
  ) {}

  async execute(userId: string, productId: string, quantity: number) {
    // 1. Verificar que el producto existe
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    // 2. Verificar stock
    if (!product.isInStock()) {
      throw new BadRequestException('Producto sin stock disponible');
    }

    // 3. Verificar si ya está en el carrito
    const existingItem = await this.cartRepository.findExistingItem(userId, productId);

    if (existingItem) {
      // Sumar cantidad
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.quantity) {
        throw new BadRequestException(
          `Stock insuficiente. Disponible: ${product.quantity}, en carrito: ${existingItem.quantity}`,
        );
      }
      return this.cartRepository.updateQuantity(existingItem.id, newQuantity);
    }

    // 4. Verificar que la cantidad no excede el stock
    if (quantity > product.quantity) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${product.quantity}`,
      );
    }

    return this.cartRepository.addItem(userId, productId, quantity);
  }
}
