import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { ICouponRepository } from '../domain/coupon.repository.interface.js';
import { COUPON_REPOSITORY } from '../domain/coupon.repository.interface.js';
import type { ICartRepository } from '../../cart/domain/cart.repository.interface.js';
import { CART_REPOSITORY } from '../../cart/domain/cart.repository.interface.js';
import type { IProductRepository } from '../../products/domain/product.repository.interface.js';
import { PRODUCT_REPOSITORY } from '../../products/domain/product.repository.interface.js';

/**
 * CU06 — Validar cupón de descuento en el carrito.
 * Verifica: existe, activo, no expirado, monto mínimo, categoría correcta.
 */
@Injectable()
export class ValidateCouponUseCase {
  constructor(
    @Inject(COUPON_REPOSITORY)
    private readonly couponRepository: ICouponRepository,
    @Inject(CART_REPOSITORY) private readonly cartRepository: ICartRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(code: string, userId: string) {
    // 1. Buscar cupón
    const coupon = await this.couponRepository.findByCode(code);
    if (!coupon) {
      return { valid: false, reason: 'Código inexistente' };
    }

    // 2. Verificar expiración
    if (coupon.isExpired()) {
      return { valid: false, reason: 'Cupón expirado' };
    }

    // 3. Verificar stock del cupón
    if (!coupon.hasStock()) {
      return { valid: false, reason: 'Cupón agotado' };
    }

    // 4. Obtener carrito y calcular total
    const cartItems = await this.cartRepository.findByUserId(userId);
    if (cartItems.length === 0) {
      return { valid: false, reason: 'Tu carrito está vacío' };
    }

    // Calcular el total del carrito
    let total = 0;
    const productCategories: string[] = [];
    for (const item of cartItems) {
      const product = await this.productRepository.findById(item.productId);
      if (product) {
        total += (product.price ?? 0) * item.quantity;
        if (product.categoryId) productCategories.push(product.categoryId);
      }
    }

    // 5. Verificar monto mínimo
    if (total < coupon.minimumAmount) {
      return {
        valid: false,
        reason: `Este cupón solo aplica para compras mayores a S/ ${coupon.minimumAmount}`,
      };
    }

    // 6. Verificar categoría (CU06)
    if (coupon.categoryId) {
      const hasMatchingCategory = productCategories.includes(coupon.categoryId);
      if (!hasMatchingCategory) {
        return {
          valid: false,
          reason: 'Cupón no aplica a los productos en tu carrito',
        };
      }
    }

    // 7. Todo OK
    const newTotal = Math.max(0, total - coupon.discountAmount);
    return {
      valid: true,
      discount: coupon.discountAmount,
      originalTotal: total,
      newTotal,
      couponId: coupon.id,
    };
  }
}
