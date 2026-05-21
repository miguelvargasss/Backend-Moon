import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import type { IOrderRepository } from '../domain/order.repository.interface.js';
import { ORDER_REPOSITORY } from '../domain/order.repository.interface.js';
import type { IUserRepository } from '../../users/domain/user.repository.interface.js';
import { USER_REPOSITORY } from '../../users/domain/user.repository.interface.js';

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
    // 1. Buscar la orden
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    const currentStatusName = order.statusName ?? 'DESCONOCIDO';

    // 2. Bloquear si ya está en estado terminal
    if (
      currentStatusName === 'FINALIZADO' ||
      currentStatusName === 'CANCELADO'
    ) {
      throw new BadRequestException(
        `No se puede modificar un pedido en estado "${currentStatusName}"`,
      );
    }

    // 3. Validar que el nuevo estado existe en la BD
    const newStatusId = await this.orderRepository.getStatusIdByName(newStatus);
    if (!newStatusId) {
      throw new BadRequestException(
        `Estado "${newStatus}" no encontrado. Verifica el nombre exacto en la base de datos.`,
      );
    }

    // 4. Actualizar estado y registrar en historial
    await this.orderRepository.updateStatus(orderId, newStatusId);
    await this.orderRepository.addHistory(orderId);

    // 5. MoonPoints: solo al confirmar Y solo si no se otorgaron antes (idempotencia)
    let pointsAwarded = 0;
    let pointsWarning: string | null = null;

    if (newStatus === 'CONFIRMADO' && !order.pointsAwarded) {
      try {
        const items = await this.orderRepository.findItemsByOrderId(orderId);

        if (items.length === 0) {
          this.logger.warn(
            `[MoonPoints] Pedido ${orderId} no tiene ítems — no se calculan puntos.`,
          );
        } else {
          const orderTotal = items.reduce(
            (sum, item) =>
              sum + Number(item.priceAtSale) * Number(item.quantity),
            0,
          );
          pointsAwarded = roundHalf(orderTotal / SOLES_PER_POINT);

          this.logger.log(
            `[MoonPoints] Pedido ${orderId} | Total: S/${orderTotal.toFixed(2)} | Puntos: ${pointsAwarded}`,
          );

          if (pointsAwarded > 0) {
            const newTotal = await this.userRepository.addPoints(
              order.userId,
              pointsAwarded,
            );
            // Marcar la orden como ya acreditada para evitar duplicados
            await this.orderRepository.markPointsAwarded(orderId);
            this.logger.log(
              `[MoonPoints] Usuario ${order.userId} ahora tiene ${newTotal} puntos.`,
            );
          }
        }
      } catch (err: any) {
        // No revertir el cambio de estado, pero reportar el fallo al llamador
        pointsWarning = `No se pudieron otorgar MoonPoints: ${err?.message ?? 'error desconocido'}`;
        this.logger.error(`[MoonPoints] ${pointsWarning}`, err?.stack);
      }
    } else if (newStatus === 'CONFIRMADO' && order.pointsAwarded) {
      this.logger.log(
        `[MoonPoints] Pedido ${orderId} ya tenía puntos acreditados — omitiendo.`,
      );
    }

    return {
      orderId,
      previousStatus: currentStatusName,
      newStatus,
      pointsAwarded,
      ...(pointsWarning ? { pointsWarning } : {}),
    };
  }
}
