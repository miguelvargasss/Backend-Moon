import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import type { IOrderRepository } from '../domain/order.repository.interface.js';
import { ORDER_REPOSITORY } from '../domain/order.repository.interface.js';

/**
 * CU07 — Detalle de una orden con sus ítems.
 * Solo el dueño o un admin puede ver la orden.
 */
@Injectable()
export class GetOrderDetailUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(orderId: string, userId: string, isAdmin = false) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    // Solo el dueño o un admin pueden ver el detalle
    if (!isAdmin && order.userId !== userId) {
      throw new ForbiddenException('No tienes acceso a este pedido');
    }

    return order;
  }
}
