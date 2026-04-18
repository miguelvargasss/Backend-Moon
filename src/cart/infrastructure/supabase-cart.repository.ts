import { Injectable } from '@nestjs/common';
import { ICartRepository } from '../domain/cart.repository.interface.js';
import { CartItem } from '../domain/cart-item.entity.js';
import { SupabaseService } from '../../supabase/supabase.service.js';
import { throwSupabaseError } from '../../common/exceptions/supabase-error.helper.js';

@Injectable()
export class SupabaseCartRepository implements ICartRepository {
  constructor(private readonly supabase: SupabaseService) {}

  private toEntity(data: Record<string, any>): CartItem {
    return new CartItem(data.IdShoppingCart, data.IdUser, data.IdProduct, data.Quantity);
  }

  async findByUserId(userId: string): Promise<CartItem[]> {
    const { data, error } = await this.supabase.adminClient
      .from('shopping_cart')
      .select('*')
      .eq('IdUser', userId);
    if (error) throwSupabaseError(error);
    return (data ?? []).map((d) => this.toEntity(d));
  }

  async findExistingItem(userId: string, productId: string): Promise<CartItem | null> {
    const { data, error } = await this.supabase.adminClient
      .from('shopping_cart')
      .select('*')
      .eq('IdUser', userId)
      .eq('IdProduct', productId)
      .maybeSingle();
    if (error) throwSupabaseError(error);
    return data ? this.toEntity(data) : null;
  }

  async addItem(userId: string, productId: string, quantity: number): Promise<CartItem> {
    const { data, error } = await this.supabase.adminClient
      .from('shopping_cart')
      .insert({ IdUser: userId, IdProduct: productId, Quantity: quantity })
      .select()
      .single();
    if (error) throwSupabaseError(error);
    return this.toEntity(data);
  }

  async updateQuantity(cartItemId: string, quantity: number): Promise<CartItem> {
    const { data, error } = await this.supabase.adminClient
      .from('shopping_cart')
      .update({ Quantity: quantity })
      .eq('IdShoppingCart', cartItemId)
      .select()
      .single();
    if (error) throwSupabaseError(error);
    return this.toEntity(data);
  }

  async removeItem(cartItemId: string): Promise<void> {
    const { error } = await this.supabase.adminClient
      .from('shopping_cart')
      .delete()
      .eq('IdShoppingCart', cartItemId);
    if (error) throwSupabaseError(error);
  }

  async clearCart(userId: string): Promise<void> {
    const { error } = await this.supabase.adminClient
      .from('shopping_cart')
      .delete()
      .eq('IdUser', userId);
    if (error) throwSupabaseError(error);
  }
}
