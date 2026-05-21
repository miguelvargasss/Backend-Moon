import { Injectable } from '@nestjs/common';
import { IOrderRepository } from '../domain/order.repository.interface.js';
import { Order, OrderItem } from '../domain/order.entity.js';
import { SupabaseService } from '../../supabase/supabase.service.js';
import { throwSupabaseError } from '../../common/exceptions/supabase-error.helper.js';

@Injectable()
export class SupabaseOrderRepository implements IOrderRepository {
  constructor(private readonly supabase: SupabaseService) {}

  private toEntity(d: Record<string, any>): Order {
    const statusName = d.status?.nameStatus ?? d.statusName;

    // Map items if present
    const items = d.order_item
      ? d.order_item.map((i: any) => this.toItemEntity(i))
      : undefined;

    // Map customer if shipping_address is present
    const customer = d.shipping_address
      ? {
          firstName: d.shipping_address.FirstName,
          lastName: d.shipping_address.LastName,
          dni: d.shipping_address.DNI,
          phone: d.shipping_address.Phone,
          address: d.shipping_address.Address,
          city: d.shipping_address.City,
          region: d.shipping_address.Region,
        }
      : undefined;

    return new Order(
      d.IdOrder,
      d.OrderCode,
      d.IdUser,
      new Date(d.Date),
      d.Time,
      d.IdShippingAddress,
      d.IdStatus,
      d.IdCoupons,
      statusName,
      items,
      customer,
      d.points_awarded === true,
    );
  }

  private toItemEntity(d: Record<string, any>): OrderItem {
    const productName = d.product?.NameProduct ?? d.productName;
    return new OrderItem(
      d.IdOrderItem,
      d.IdOrder,
      d.IdProduct,
      d.Quantity,
      d.PriceAtSale,
      productName,
    );
  }

  async findById(id: string): Promise<Order | null> {
    const { data, error } = await this.supabase.adminClient
      .from('order')
      .select(
        '*, status:status(nameStatus), shipping_address(*), order_item(*, product:product(NameProduct))',
      )
      .eq('IdOrder', id)
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throwSupabaseError(error);

    return this.toEntity(data);
  }

  async findByUserId(userId: string): Promise<Order[]> {
    const { data, error } = await this.supabase.adminClient
      .from('order')
      .select(
        '*, status:status(nameStatus), shipping_address(*), order_item(*, product:product(NameProduct))',
      )
      .eq('IdUser', userId)
      .order('Date', { ascending: false });
    if (error) throwSupabaseError(error);
    return (data ?? []).map((d) => this.toEntity(d));
  }

  async findAll(): Promise<Order[]> {
    const { data, error } = await this.supabase.adminClient
      .from('order')
      .select(
        '*, status:status(nameStatus), shipping_address(*), order_item(*, product:product(NameProduct))',
      )
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

  async findAllStatuses(): Promise<{ id: string; name: string }[]> {
    const { data, error } = await this.supabase.adminClient
      .from('status')
      .select('IdStatus, nameStatus')
      .order('nameStatus');
    if (error) throwSupabaseError(error);
    return (data ?? []).map((d) => ({ id: d.IdStatus, name: d.nameStatus }));
  }

  async markPointsAwarded(orderId: string): Promise<void> {
    const { error } = await this.supabase.adminClient
      .from('order')
      .update({ points_awarded: true })
      .eq('IdOrder', orderId);
    if (error) throwSupabaseError(error);
  }
}
