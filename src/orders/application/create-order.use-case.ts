import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { type IOrderRepository, ORDER_REPOSITORY } from '../domain/order.repository.interface.js';
import { type ICartRepository, CART_REPOSITORY } from '../../cart/domain/cart.repository.interface.js';
import { type IProductRepository, PRODUCT_REPOSITORY } from '../../products/domain/product.repository.interface.js';
import { type IShippingRepository, SHIPPING_REPOSITORY } from '../../shipping/domain/shipping.repository.interface.js';
import { ValidateCouponUseCase } from '../../coupons/application/validate-coupon.use-case.js';
import { type ICouponRepository, COUPON_REPOSITORY } from '../../coupons/domain/coupon.repository.interface.js';
import { ConfigService } from '@nestjs/config';

/**
 * CU03 — Checkout completo.
 * Genera código único, congela precios, descuenta stock,
 * aplica cupón si existe, vacía carrito, genera link WhatsApp.
 */
@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(CART_REPOSITORY) private readonly cartRepository: ICartRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(SHIPPING_REPOSITORY)
    private readonly shippingRepository: IShippingRepository,
    @Inject(COUPON_REPOSITORY)
    private readonly couponRepository: ICouponRepository,
    private readonly validateCouponUseCase: ValidateCouponUseCase,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    userId: string,
    shippingAddressId: string,
    couponCode?: string,
  ) {
    const cartItems = await this.cartRepository.findByUserId(userId);
    if (cartItems.length === 0) {
      throw new BadRequestException('Tu carrito está vacío');
    }

    const { orderItems, stockOps, total } = await this.buildOrderItems(cartItems);

    let couponId: string | undefined;
    let discount = 0;
    if (couponCode) {
      const couponResult = await this.validateCouponUseCase.execute(
        couponCode,
        userId,
      );
      couponId = couponResult.couponId;
      discount = couponResult.discountAmount;
    }

    const address = await this.shippingRepository.findById(shippingAddressId);
    if (!address) {
      throw new NotFoundException('Dirección de envío no encontrada');
    }

    const orderCode = await this.generateUniqueCode();

    const statusId = await this.orderRepository.getStatusIdByName('EN PROCESO');
    if (!statusId) {
      throw new BadRequestException(
        'Estado "EN PROCESO" no configurado en la BD',
      );
    }

    const order = await this.orderRepository.create(
      {
        orderCode,
        userId,
        date: new Date(),
        shippingAddressId,
        statusId,
        couponId,
      } as any,
      orderItems,
    );

    await this.processStockReductions(stockOps);

    if (couponId) {
      await this.couponRepository.decrementQuantity(couponId);
    }

    await this.cartRepository.clearCart(userId);

    const pointsEarned = Math.floor(total / 2);
    const finalTotal = Math.max(0, total - discount);

    const whatsappUrl = this.buildWhatsappUrl(orderCode, address, orderItems, finalTotal, discount);

    return {
      order,
      total: finalTotal,
      discount,
      whatsappUrl,
      pointsEarned,
    };
  }

  private async buildOrderItems(cartItems: any[]) {
    const orderItems: {
      productId: string;
      quantity: number;
      priceAtSale: number;
      productName: string;
    }[] = [];
    const stockOps: Array<
      | { kind: 'product'; productId: string; quantity: number }
      | { kind: 'variant'; variantId: string; quantity: number }
    > = [];
    let total = 0;

    for (const item of cartItems) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new NotFoundException(`Producto no encontrado: ${item.productId}`);
      }

      let variant: { id: string; stock: number; price: number } | null = null;
      if (item.variantId) {
        const found =
          product.productType === 'single'
            ? product.variants.find((v: any) => v.id === item.variantId)
            : product.styles
                .flatMap((s: any) => s.variants)
                .find((v: any) => v.id === item.variantId);
        if (!found) {
          throw new NotFoundException(`Variante no encontrada para "${product.name}"`);
        }
        variant = { id: found.id, stock: found.stock, price: Number(found.price) };
      }

      const availableStock = variant ? variant.stock : product.totalStock;
      if (item.quantity > availableStock) {
        throw new BadRequestException(
          `Stock insuficiente para "${product.name}". Disponible: ${availableStock}`,
        );
      }

      const priceAtSale = variant?.price ?? product.price ?? 0;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtSale,
        productName: product.name,
      });
      total += priceAtSale * item.quantity;

      if (variant) {
        stockOps.push({ kind: 'variant', variantId: variant.id, quantity: item.quantity });
      } else {
        stockOps.push({ kind: 'product', productId: item.productId, quantity: item.quantity });
      }
    }

    return { orderItems, stockOps, total };
  }

  private async processStockReductions(stockOps: any[]) {
    for (const op of stockOps) {
      if (op.kind === 'variant') {
        await this.productRepository.decrementVariantStock(op.variantId, op.quantity);
      } else {
        await this.productRepository.decrementProductStock(op.productId, op.quantity);
      }
    }
  }

  private buildWhatsappUrl(orderCode: string, address: any, orderItems: any[], finalTotal: number, discount: number): string {
    const whatsappNumber = this.configService
      .get<string>('WHATSAPP_NUMBER', '+51999159716')
      .replace('+', '');

    const whatsappMessage = encodeURIComponent(
      `🌙 *Nuevo pedido MoonPhases*\n` +
        `📋 Código: ${orderCode}\n` +
        `👤 ${address.firstName} ${address.lastName}\n` +
        `📍 ${address.address}, ${address.city}\n` +
        `📱 ${address.phone}\n` +
        `\n📦 Productos:\n` +
        orderItems
          .map(
            (i) =>
              `• ${i.productName} x${i.quantity} — S/ ${(i.priceAtSale * i.quantity).toFixed(2)}`,
          )
          .join('\n') +
        `\n\n💰 Total: S/ ${finalTotal.toFixed(2)}` +
        (discount > 0 ? `\n🎟️ Descuento: -S/ ${discount.toFixed(2)}` : ''),
    );

    return `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
  }

  /** Genera código alfanumérico de 7 caracteres, verifica unicidad */
  private async generateUniqueCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    let exists: boolean;

    do {
      code = Array.from({ length: 7 }, () =>
        chars.charAt(randomInt(0, chars.length)),
      ).join('');
      exists = await this.orderRepository.existsByOrderCode(code);
    } while (exists);

    return code;
  }
}
