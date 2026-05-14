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
import type { IUserRepository } from '../../users/domain/user.repository.interface.js';
import { USER_REPOSITORY } from '../../users/domain/user.repository.interface.js';
import { ConfigService } from '@nestjs/config';

/** Regla de negocio MoonPoints: 1 punto por cada S/2 gastados. */
const SOLES_PER_POINT = 2;

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
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
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
    //    Resolvemos la variante si el cart item la trae.
    const orderItems: {
      productId: string;
      quantity: number;
      priceAtSale: number;
      productName: string;
    }[] = [];
    // Lista paralela para decrementar stock una vez creada la orden.
    const stockOps: Array<
      | { kind: 'product'; productId: string; quantity: number }
      | { kind: 'variant'; variantId: string; quantity: number }
    > = [];
    let total = 0;

    for (const item of cartItems) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new NotFoundException(
          `Producto no encontrado: ${item.productId}`,
        );
      }

      // Resolver variante si aplica
      let variant: { id: string; stock: number; price: number } | null = null;
      if (item.variantId) {
        const found =
          product.productType === 'single'
            ? product.variants.find((v) => v.id === item.variantId)
            : product.styles
                .flatMap((s) => s.variants)
                .find((v) => v.id === item.variantId);
        if (!found) {
          throw new NotFoundException(
            `Variante no encontrada para "${product.name}"`,
          );
        }
        variant = { id: found.id, stock: found.stock, price: Number(found.price) };
      }

      // Validar stock (por variante si existe, sino producto)
      const availableStock = variant ? variant.stock : product.totalStock;
      if (item.quantity > availableStock) {
        throw new BadRequestException(
          `Stock insuficiente para "${product.name}". Disponible: ${availableStock}`,
        );
      }

      // Precio congelado: variante > producto base
      const priceAtSale = variant?.price ?? product.price ?? 0;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtSale,
        productName: product.name,
      });
      total += priceAtSale * item.quantity;

      // Registrar operación de stock a aplicar luego
      if (variant) {
        stockOps.push({
          kind: 'variant',
          variantId: variant.id,
          quantity: item.quantity,
        });
      } else {
        stockOps.push({
          kind: 'product',
          productId: item.productId,
          quantity: item.quantity,
        });
      }
    }

    // 3. Validar cupón si existe
    let couponId: string | undefined;
    let discount = 0;
    if (couponCode) {
      const couponResult = await this.validateCouponUseCase.execute(
        couponCode,
        userId,
      );
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
      throw new BadRequestException(
        'Estado "EN PROCESO" no configurado en la BD',
      );
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

    // 8. Reducir stock — variante si existe, sino producto base
    for (const op of stockOps) {
      if (op.kind === 'variant') {
        await this.productRepository.decrementVariantStock(
          op.variantId,
          op.quantity,
        );
      } else {
        await this.productRepository.decrementProductStock(
          op.productId,
          op.quantity,
        );
      }
    }

    // 9. Decrementar cupón si se usó
    if (couponId) {
      await this.couponRepository.decrementQuantity(couponId);
    }

    // 10. Vaciar carrito
    await this.cartRepository.clearCart(userId);

    // 10.5 Otorgar MoonPoints — 1 punto por cada S/SOLES_PER_POINT del total final.
    // Envuelto en try/catch para que un fallo de fidelización no invalide el pedido.
    const finalTotalForPoints = Math.max(0, total - discount);
    const pointsEarned = Math.floor(finalTotalForPoints / SOLES_PER_POINT);
    let totalPoints: number | undefined;
    if (pointsEarned > 0) {
      try {
        totalPoints = await this.userRepository.addPoints(userId, pointsEarned);
      } catch (err) {
        // Log silencioso — el pedido ya está confirmado y debe responder éxito
        console.error('[CreateOrder] Falló otorgar MoonPoints:', err);
      }
    }

    // 11. Construir URL WhatsApp
    const whatsappNumber = this.configService
      .get<string>('WHATSAPP_NUMBER', '+51999159716')
      .replace('+', '');
    const finalTotal = Math.max(0, total - discount);

    const itemsSummary = orderItems
      .map(
        (i) =>
          `• ${i.productName} x${i.quantity} — S/ ${(i.priceAtSale * i.quantity).toFixed(2)}`,
      )
      .join('%0A');

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

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

    return {
      order,
      total: finalTotal,
      discount,
      whatsappUrl,
      pointsEarned,
      totalPoints,
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
