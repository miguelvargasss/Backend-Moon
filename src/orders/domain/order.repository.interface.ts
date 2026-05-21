import { Order, OrderItem } from './order.entity.js';

export const ORDER_REPOSITORY = 'ORDER_REPOSITORY';

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByUserId(userId: string): Promise<Order[]>;
  findAll(): Promise<Order[]>;
  create(
    data: Omit<Order, 'id' | 'items' | 'statusName'>,
    items: Omit<OrderItem, 'id' | 'orderId' | 'subtotal' | 'productName'>[],
  ): Promise<Order>;
  findItemsByOrderId(orderId: string): Promise<OrderItem[]>;
  updateStatus(orderId: string, statusId: string): Promise<void>;
  existsByOrderCode(code: string): Promise<boolean>;
  addHistory(orderId: string): Promise<void>;
  getStatusIdByName(name: string): Promise<string | null>;
  getStatusNameById(id: string): Promise<string | null>;
  findAllStatuses(): Promise<{ id: string; name: string }[]>;
  markPointsAwarded(orderId: string): Promise<void>;
}
