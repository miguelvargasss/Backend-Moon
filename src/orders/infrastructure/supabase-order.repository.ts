import { Injectable } from '@nestjs/common';
import { IOrderRepository } from '../domain/order.repository.interface.js';
import { Order, OrderItem } from '../domain/order.entity.js';
import { SupabaseService } from '../../supabase/supabase.service.js';
import { throwSupabaseError } from '../../common/exceptions/supabase-error.helper.js';

@Injectable()
export class SupabaseOrderRepository implements IOrderRepository {
  constructor(private readonly supabase: SupabaseService) {}

  private toEntity(d: Record<string, any>): Order {
    const statusName = (d.status as any)?.nameStatus ?? d.statusName;
    return new Order(
      d.IdOrder, d.OrderCode, d.IdUser, new Date(d.Date),
      d.Time, d.IdShippingAddress, d.IdStatus, d.IdCoupons,
      statusName,
    );
  }

  private toItemEntity(d: Record<string, any>): OrderItem {
    const productName = (d.product as any)?.NameProduct ?? d.productName;
    return new OrderItem(
      d.IdOrderItem, d.IdOrder, d.IdProduct,
      d.Quantity, d.PriceAtSale, productName,
    );
  }

  async findById(id: string): Promise<Order | null> {
    const { data, error } = await this.supabase.adminClient
      .from('order')
      .select('*, status:status(nameStatus)')
      .eq('IdOrder', id)
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throwSupabaseError(error);

    const items = await this.findItemsByOrderId(id);
    const order = this.toEntity(data);
    return new Order(
      order.id, order.orderCode, order.userId, order.date,
      order.time, order.shippingAddressId, order.statusId, order.couponId,
      order.statusName, items,
    );
  }

  async findByUserId(userId: string): Promise<Order[]> {
    const { data, error } = await this.supabase.adminClient
      .from('order')
      .select('*, status:status(nameStatus)')
      .eq('IdUser', userId)
      .order('Date', { ascending: false });
    if (error) throwSupabaseError(error);
    return (data ?? []).map((d) => this.toEntity(d));
  }

  async findAll(): Promise<Order[]> {
    const { data, error } = await this.supabase.adminClient
      .from('order')
      .select('*, status:status(nameStatus)')
      .order('Date', { ascending: false });
    if (error) throwSupabaseError(error);
    return (data ?? []).map((d) => this.toEntity(d));
  }

  async create(
    orderData: Omit<Order, 'id' | 'items' | 'statusName'>,
    items: Omit<OrderItem, 'id' | 'orderId' | 'subtotal' | 'productName'>[],
  ): Promise<Order> {
    const { data: order, error } = await this.supabase.adminClient
      .from('order')
      .insert({
        OrderCode: orderData.orderCode,
        IdUser: orderData.userId,
        Date: orderData.date,
        IdShippingAddress: orderData.shippingAddressId,
        IdStatus: orderData.statusId,
        IdCoupons: orderData.couponId,
      })
      .select('*, status:status(nameStatus)')
      .single();
    if (error) throwSupabaseError(error);

    // Insertar ítems
    const { error: itemsError } = await this.supabase.adminClient
      .from('order_item')
      .insert(
        items.map((i) => ({
          IdOrder: order.IdOrder,
          IdProduct: i.productId,
          Quantity: i.quantity,
          PriceAtSale: i.priceAtSale,
        })),
      );
    if (itemsError) throwSupabaseError(itemsError);

    return this.toEntity(order);
  }

  async findItemsByOrderId(orderId: string): Promise<OrderItem[]> {
    const { data, error } = await this.supabase.adminClient
      .from('order_item')
      .select('*, product:product(NameProduct)')
      .eq('IdOrder', orderId);
    if (error) throwSupabaseError(error);
    return (data ?? []).map((d) => this.toItemEntity(d));
  }

  async updateStatus(orderId: string, statusId: string): Promise<void> {
    const { error } = await this.supabase.adminClient
      .from('order')
      .update({ IdStatus: statusId })
      .eq('IdOrder', orderId);
    if (error) throwSupabaseError(error);
  }

  async existsByOrderCode(code: string): Promise<boolean> {
    const { count, error } = await this.supabase.adminClient
      .from('order')
      .select('*', { count: 'exact', head: true })
      .eq('OrderCode', code);
    if (error) throwSupabaseError(error);
    return (count ?? 0) > 0;
  }

  async addHistory(orderId: string): Promise<void> {
    const { error } = await this.supabase.adminClient
      .from('order_history')
      .insert({ IdOrder: orderId });
    if (error) throwSupabaseError(error);
  }

  async getStatusIdByName(name: string): Promise<string | null> {
    const { data, error } = await this.supabase.adminClient
      .from('status')
      .select('IdStatus')
      .eq('nameStatus', name)
      .maybeSingle();
    if (error) throwSupabaseError(error);
    return data?.IdStatus ?? null;
  }

  async getStatusNameById(id: string): Promise<string | null> {
    const { data, error } = await this.supabase.adminClient
      .from('status')
      .select('nameStatus')
      .eq('IdStatus', id)
      .maybeSingle();
    if (error) throwSupabaseError(error);
    return data?.nameStatus ?? null;
  }
}
