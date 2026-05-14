import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { ICartRepository } from '../domain/cart.repository.interface.js';
import { CART_REPOSITORY } from '../domain/cart.repository.interface.js';
import type { IProductRepository } from '../../products/domain/product.repository.interface.js';
import { PRODUCT_REPOSITORY } from '../../products/domain/product.repository.interface.js';
import { ProductVariant } from '../../products/domain/product-variant.entity.js';

/**
 * CU02 — Agregar producto al carrito.
 * Verifica stock (producto o variante), merge de duplicados.
 */
@Injectable()
export class AddToCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepository: ICartRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(
    userId: string,
    productId: string,
    quantity: number,
    variantId?: string,
  ) {
    // 1. Verificar que el producto existe
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    // 2. Resolver stock disponible
    let availableStock = product.totalStock;
    let variant: ProductVariant | undefined;

    if (variantId) {
      // Buscar la variante específica
      if (product.productType === 'single') {
        variant = product.variants.find((v) => v.id === variantId);
      } else {
        // multiple: buscar en estilos
        for (const style of product.styles) {
          variant = style.variants.find((v) => v.id === variantId);
          if (variant) break;
        }
      }
      if (!variant) {
        throw new NotFoundException('Variante no encontrada');
      }
      availableStock = variant.stock;
    }

    // 3. Verificar stock
    if (availableStock <= 0) {
      throw new BadRequestException('Producto sin stock disponible');
    }

    // 4. Verificar si ya está en el carrito
    const existingItem = await this.cartRepository.findExistingItem(
      userId,
      productId,
      variantId ?? null,
    );

    if (existingItem) {
      // Sumar cantidad
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > availableStock) {
        throw new BadRequestException(
          `Stock insuficiente. Disponible: ${availableStock}, en carrito: ${existingItem.quantity}`,
        );
      }
      return this.cartRepository.updateQuantity(existingItem.id, newQuantity);
    }

    // 5. Verificar que la cantidad no excede el stock
    if (quantity > availableStock) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${availableStock}`,
      );
    }

    return this.cartRepository.addItem(
      userId,
      productId,
      quantity,
      variantId ?? null,
    );
  }
}
