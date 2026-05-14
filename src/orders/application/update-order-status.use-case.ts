import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { IOrderRepository } from '../domain/order.repository.interface.js';
import { ORDER_REPOSITORY } from '../domain/order.repository.interface.js';

/**
 * CU08 — Admin cambia el estado de un pedido.
 * Bloquea cambios si el pedido ya está FINALIZADO o CANCELADO.
 * Registra el cambio en order_history.
 */
@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(orderId: string, newStatus: string) {
    // 1. Buscar la orden
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    // 2. Verificar estado actual — bloquear si ya finalizó o canceló
    const currentStatusName = order.statusName;
    if (
      currentStatusName === 'FINALIZADO' ||
      currentStatusName === 'CANCELADO'
    ) {
      throw new BadRequestException(
        `No se puede modificar un pedido en estado "${currentStatusName}"`,
      );
    }

    // 3. Obtener el ID del nuevo estado
    const newStatusId = await this.orderRepository.getStatusIdByName(newStatus);
    if (!newStatusId) {
      throw new BadRequestException(`Estado "${newStatus}" no encontrado`);
    }

    // 4. Actualizar estado
    await this.orderRepository.updateStatus(orderId, newStatusId);

    // 5. Registrar cambio en historial
    await this.orderRepository.addHistory(orderId);

    return { orderId, previousStatus: currentStatusName, newStatus };
  }
}
