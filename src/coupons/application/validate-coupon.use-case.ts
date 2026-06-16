import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { type ICouponRepository, COUPON_REPOSITORY } from '../domain/coupon.repository.interface.js';
import { type ICartRepository, CART_REPOSITORY } from '../../cart/domain/cart.repository.interface.js';
import { type IProductRepository, PRODUCT_REPOSITORY } from '../../products/domain/product.repository.interface.js';

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
    const coupon = await this.couponRepository.findByCode(code);
    if (!coupon) {
      throw new BadRequestException('El codigo de Cupon no existe!');
    }

    if (coupon.isExpired()) {
      throw new BadRequestException('Este cupón ya ha expirado!');
    }
    if (!coupon.hasStock()) {
      throw new BadRequestException('Este cupón ya no tiene usos disponibles!');
    }

    const cartItems = await this.cartRepository.findByUserId(userId);
    if (cartItems.length === 0) {
      throw new BadRequestException('El carrito esta vacio!');
    }

    const { totalGeneral, subtotalElegible } = await this.calculateTotals(cartItems, coupon.categoryId);

    if (coupon.categoryId && subtotalElegible === 0) {
      throw new BadRequestException(
        'Este cupón no aplica a los productos en tu carrito.',
      );
    }

    if (subtotalElegible < coupon.minimumAmount) {
      throw new BadRequestException(
        coupon.categoryId
          ? `Debes tener al menos S/ ${coupon.minimumAmount} en productos de la categoría requerida.`
          : `El monto mínimo de compra para este cupón es de S/ ${coupon.minimumAmount}.`,
      );
    }

    const applicableSubtotal = coupon.categoryId
      ? subtotalElegible
      : totalGeneral;
    const discountToApply =
      coupon.discountType === 'percentage'
        ? (applicableSubtotal * Math.min(coupon.discountAmount, 100)) / 100
        : Math.min(coupon.discountAmount, applicableSubtotal);
        
    return {
      valid: true,
      discountAmount: discountToApply,
      originalTotal: totalGeneral,
      couponId: coupon.id,
    };
  }

  private async calculateTotals(cartItems: any[], couponCategoryId?: string | null) {
    let totalGeneral = 0;
    let subtotalElegible = 0;

    for (const item of cartItems) {
      const product = await this.productRepository.findById(item.productId);
      if (product) {
        const unitPrice = item.productPrice ?? product.price ?? 0;
        const itemTotal = unitPrice * item.quantity;
        totalGeneral += itemTotal;

        if (!couponCategoryId || product.categoryId === couponCategoryId) {
          subtotalElegible += itemTotal;
        }
      }
    }

    return { totalGeneral, subtotalElegible };
  }
}
