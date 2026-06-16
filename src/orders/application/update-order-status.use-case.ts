import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { type IOrderRepository, ORDER_REPOSITORY } from '../domain/order.repository.interface.js';
import { type IUserRepository, USER_REPOSITORY } from '../../users/domain/user.repository.interface.js';

/** Regla de negocio MoonPoints: 1 punto por cada S/2 gastados (granularidad 0.5). */
const SOLES_PER_POINT = 2;

/** Redondea a 1 decimal (0.5 de granularidad) → 3 soles = 1.5 pts, 5 soles = 2.5 pts */
const roundHalf = (n: number) => Math.round(n * 10) / 10;

/**
 * CU08 — Admin cambia el estado de un pedido.
 * - Bloquea cambios si el pedido ya está FINALIZADO o CANCELADO.
 * - Registra el cambio en order_history.
 * - Otorga MoonPoints al confirmar (idempotente: solo una vez por pedido).
 * - El fallo de puntos NO revierte el cambio de estado, pero se reporta.
 */
@Injectable()
export class UpdateOrderStatusUseCase {
  private readonly logger = new Logger(UpdateOrderStatusUseCase.name);

  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(orderId: string, newStatus: string) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    const currentStatusName = order.statusName ?? 'DESCONOCIDO';

    if (
      currentStatusName === 'FINALIZADO' ||
      currentStatusName === 'CANCELADO'
    ) {
      throw new BadRequestException(
        `No se puede modificar un pedido en estado "${currentStatusName}"`,
      );
    }

    const newStatusId = await this.orderRepository.getStatusIdByName(newStatus);
    if (!newStatusId) {
      throw new BadRequestException(
        `Estado "${newStatus}" no encontrado. Verifica el nombre exacto en la base de datos.`,
      );
    }

    await this.orderRepository.updateStatus(orderId, newStatusId);
    await this.orderRepository.addHistory(orderId);

    const { pointsAwarded, pointsWarning } = await this.awardMoonPoints(order, newStatus);

    return {
      orderId,
      previousStatus: currentStatusName,
      newStatus,
      pointsAwarded,
      ...(pointsWarning ? { pointsWarning } : {}),
    };
  }

  private async awardMoonPoints(order: any, newStatus: string) {
    let pointsAwarded = 0;
    let pointsWarning: string | null = null;

    if (newStatus !== 'CONFIRMADO') {
      return { pointsAwarded, pointsWarning };
    }

    if (order.pointsAwarded) {
      this.logger.log(`[MoonPoints] Pedido ${order.id} ya tenía puntos acreditados — omitiendo.`);
      return { pointsAwarded, pointsWarning };
    }

    try {
      const items = await this.orderRepository.findItemsByOrderId(order.id);

      if (items.length === 0) {
        this.logger.warn(`[MoonPoints] Pedido ${order.id} no tiene ítems — no se calculan puntos.`);
        return { pointsAwarded, pointsWarning };
      }

      const orderTotal = items.reduce(
        (sum: number, item: any) => sum + Number(item.priceAtSale) * Number(item.quantity),
        0,
      );
      pointsAwarded = roundHalf(orderTotal / SOLES_PER_POINT);

      this.logger.log(
        `[MoonPoints] Pedido ${order.id} | Total: S/${orderTotal.toFixed(2)} | Puntos: ${pointsAwarded}`,
      );

      if (pointsAwarded > 0) {
        const newTotal = await this.userRepository.addPoints(
          order.userId,
          pointsAwarded,
        );
        await this.orderRepository.markPointsAwarded(order.id);
        this.logger.log(`[MoonPoints] Usuario ${order.userId} ahora tiene ${newTotal} puntos.`);
      }
    } catch (err: any) {
      pointsWarning = `No se pudieron otorgar MoonPoints: ${err?.message ?? 'error desconocido'}`;
      this.logger.error(`[MoonPoints] ${pointsWarning}`, err?.stack);
    }

    return { pointsAwarded, pointsWarning };
  }
}
