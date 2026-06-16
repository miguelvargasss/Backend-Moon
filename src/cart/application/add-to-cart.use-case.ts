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
import { Product } from '../../products/domain/product.entity.js';

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
    const product = await this.productRepository.findById(productId);
    this.ensureProductExists(product);

    const availableStock = this.getAvailableStock(product, variantId);
    this.ensureSufficientStock(availableStock, quantity);

    const existingItem = await this.cartRepository.findExistingItem(
      userId,
      productId,
      variantId ?? null,
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      this.ensureSufficientStockForUpdate(availableStock, existingItem.quantity, newQuantity);
      return this.cartRepository.updateQuantity(existingItem.id, newQuantity);
    }

    return this.cartRepository.addItem(
      userId,
      productId,
      quantity,
      variantId ?? null,
    );
  }

  private ensureProductExists(product: Product | null): asserts product is Product {
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
  }

  private getAvailableStock(product: Product, variantId?: string): number {
    if (!variantId) {
      return product.totalStock;
    }

    let variant: ProductVariant | undefined;
    if (product.productType === 'single') {
      variant = product.variants.find((v) => v.id === variantId);
    } else {
      for (const style of product.styles) {
        variant = style.variants.find((v) => v.id === variantId);
        if (variant) break;
      }
    }

    if (!variant) {
      throw new NotFoundException('Variante no encontrada');
    }
    
    return variant.stock;
  }

  private ensureSufficientStock(availableStock: number, requestedQuantity: number): void {
    if (availableStock <= 0) {
      throw new BadRequestException('Producto sin stock disponible');
    }
    if (requestedQuantity > availableStock) {
      throw new BadRequestException(`Stock insuficiente. Disponible: ${availableStock}`);
    }
  }

  private ensureSufficientStockForUpdate(
    availableStock: number, 
    currentQuantity: number, 
    newQuantity: number
  ): void {
    if (newQuantity > availableStock) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${availableStock}, en carrito: ${currentQuantity}`,
      );
    }
  }
}
