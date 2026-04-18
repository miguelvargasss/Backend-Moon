import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { IOrderRepository } from '../domain/order.repository.interface.js';
import { ORDER_REPOSITORY } from '../domain/order.repository.interface.js';
import type { ICartRepository } from '../../cart/domain/cart.repository.interface.js';
import { CART_REPOSITORY } from '../../cart/domain/cart.repository.interface.js';
import type { IProductRepository } from '../../products/domain/product.repository.interface.js';
import { PRODUCT_REPOSITORY } from '../../products/domain/product.repository.interface.js';
import type { IShippingRepository } from '../../shipping/domain/shipping.repository.interface.js';
import { SHIPPING_REPOSITORY } from '../../shipping/domain/shipping.repository.interface.js';
import { ValidateCouponUseCase } from '../../coupons/application/validate-coupon.use-case.js';
import type { ICouponRepository } from '../../coupons/domain/coupon.repository.interface.js';
import { COUPON_REPOSITORY } from '../../coupons/domain/coupon.repository.interface.js';
import { ConfigService } from '@nestjs/config';

/**
 * CU03 — Checkout completo.
 * Genera código único, congela precios, descuenta stock,
 * aplica cupón si existe, vacía carrito, genera link WhatsApp.
 */
@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepository: IOrderRepository,
    @Inject(CART_REPOSITORY) private readonly cartRepository: ICartRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
    @Inject(SHIPPING_REPOSITORY) private readonly shippingRepository: IShippingRepository,
    @Inject(COUPON_REPOSITORY) private readonly couponRepository: ICouponRepository,
    private readonly validateCouponUseCase: ValidateCouponUseCase,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    userId: string,
    shippingAddressId: string,
    couponCode?: string,
  ) {
    // 1. Obtener carrito
    const cartItems = await this.cartRepository.findByUserId(userId);
    if (cartItems.length === 0) {
      throw new BadRequestException('Tu carrito está vacío');
    }

    // 2. Verificar stock y construir ítems de la orden
    const orderItems: { productId: string; quantity: number; priceAtSale: number; productName: string }[] = [];
    let total = 0;

    for (const item of cartItems) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new NotFoundException(`Producto no encontrado: ${item.productId}`);
      }
      if (item.quantity > product.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para "${product.name}". Disponible: ${product.quantity}`,
        );
      }
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtSale: product.price,
        productName: product.name,
      });
      total += product.price * item.quantity;
    }

    // 3. Validar cupón si existe
    let couponId: string | undefined;
    let discount = 0;
    if (couponCode) {
      const couponResult = await this.validateCouponUseCase.execute(couponCode, userId);
      if (!couponResult.valid) {
        throw new BadRequestException(couponResult.reason);
      }
      couponId = couponResult.couponId;
      discount = couponResult.discount ?? 0;
    }

    // 4. Verificar dirección de envío
    const address = await this.shippingRepository.findById(shippingAddressId);
    if (!address) {
      throw new NotFoundException('Dirección de envío no encontrada');
    }

    // 5. Generar código alfanumérico único (ej: M892BGS)
    const orderCode = await this.generateUniqueCode();

    // 6. Obtener IdStatus para "EN PROCESO"
    const statusId = await this.orderRepository.getStatusIdByName('EN PROCESO');
    if (!statusId) {
      throw new BadRequestException('Estado "EN PROCESO" no configurado en la BD');
    }

    // 7. Crear orden
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

    // 8. Reducir stock de cada producto
    for (const item of orderItems) {
      const product = await this.productRepository.findById(item.productId);
      if (product) {
        await this.productRepository.update(item.productId, {
          quantity: product.quantity - item.quantity,
        } as any);
      }
    }

    // 9. Decrementar cupón si se usó
    if (couponId) {
      await this.couponRepository.decrementQuantity(couponId);
    }

    // 10. Vaciar carrito
    await this.cartRepository.clearCart(userId);

    // 11. Construir URL WhatsApp
    const whatsappNumber = this.configService.get<string>('WHATSAPP_NUMBER', '+51999159716')
      .replace('+', '');
    const finalTotal = Math.max(0, total - discount);

    const itemsSummary = orderItems
      .map((i) => `• ${i.productName} x${i.quantity} — S/ ${(i.priceAtSale * i.quantity).toFixed(2)}`)
      .join('%0A');

    const whatsappMessage = encodeURIComponent(
      `🌙 *Nuevo pedido MoonPhases*\n` +
      `📋 Código: ${orderCode}\n` +
      `👤 ${address.firstName} ${address.lastName}\n` +
      `📍 ${address.address}, ${address.city}\n` +
      `📱 ${address.phone}\n` +
      `\n📦 Productos:\n` +
      orderItems.map((i) => `• ${i.productName} x${i.quantity} — S/ ${(i.priceAtSale * i.quantity).toFixed(2)}`).join('\n') +
      `\n\n💰 Total: S/ ${finalTotal.toFixed(2)}` +
      (discount > 0 ? `\n🎟️ Descuento: -S/ ${discount.toFixed(2)}` : ''),
    );

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

    return {
      order,
      total: finalTotal,
      discount,
      whatsappUrl,
    };
  }

  /** Genera código alfanumérico de 7 caracteres, verifica unicidad */
  private async generateUniqueCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    let exists: boolean;

    do {
      code = Array.from({ length: 7 }, () =>
        chars.charAt(Math.floor(Math.random() * chars.length)),
      ).join('');
      exists = await this.orderRepository.existsByOrderCode(code);
    } while (exists);

    return code;
  }
}
