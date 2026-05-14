import { Injectable } from '@nestjs/common';
import { ICouponRepository } from '../domain/coupon.repository.interface.js';
import { Coupon } from '../domain/coupon.entity.js';
import { SupabaseService } from '../../supabase/supabase.service.js';
import { throwSupabaseError } from '../../common/exceptions/supabase-error.helper.js';

@Injectable()
export class SupabaseCouponRepository implements ICouponRepository {
  constructor(private readonly supabase: SupabaseService) {}

  private toEntity(data: Record<string, any>): Coupon {
    return new Coupon(
      data.IdCoupons,
      data.Code,
      new Date(data.ExpirationDate),
      data.CouponQuantity,
      data.MinimumAmount,
      data.DiscountAmount,
      data.IdCategorie,
    );
  }

  async findByCode(code: string): Promise<Coupon | null> {
    const { data, error } = await this.supabase.adminClient
      .from('coupons')
      .select('*')
      .eq('Code', code)
      .maybeSingle();
    if (error) throwSupabaseError(error);
    return data ? this.toEntity(data) : null;
  }

  async findAll(): Promise<Coupon[]> {
    const { data, error } = await this.supabase.adminClient
      .from('coupons')
      .select('*')
      .order('ExpirationDate', { ascending: false });
    if (error) throwSupabaseError(error);
    return (data ?? []).map((d) => this.toEntity(d));
  }

  async create(
    couponData: Omit<Coupon, 'id' | 'isValid' | 'isExpired' | 'hasStock'>,
  ): Promise<Coupon> {
    const { data, error } = await this.supabase.adminClient
      .from('coupons')
      .insert({
        Code: couponData.code,
        ExpirationDate: couponData.expirationDate,
        CouponQuantity: couponData.couponQuantity,
        MinimumAmount: couponData.minimumAmount,
        DiscountAmount: couponData.discountAmount,
        IdCategorie: couponData.categoryId,
      })
      .select()
      .single();
    if (error) throwSupabaseError(error);
    return this.toEntity(data);
  }

  async update(
    id: string,
    couponData: Partial<Omit<Coupon, 'id' | 'isValid' | 'isExpired' | 'hasStock'>>,
  ): Promise<Coupon> {
    const payload: Record<string, any> = {};
    if (couponData.code !== undefined) payload['Code'] = couponData.code;
    if (couponData.expirationDate !== undefined) payload['ExpirationDate'] = couponData.expirationDate;
    if (couponData.couponQuantity !== undefined) payload['CouponQuantity'] = couponData.couponQuantity;
    if (couponData.minimumAmount !== undefined) payload['MinimumAmount'] = couponData.minimumAmount;
    if (couponData.discountAmount !== undefined) payload['DiscountAmount'] = couponData.discountAmount;
    if (couponData.categoryId !== undefined) payload['IdCategorie'] = couponData.categoryId;

    const { data, error } = await this.supabase.adminClient
      .from('coupons')
      .update(payload)
      .eq('IdCoupons', id)
      .select()
      .single();
    if (error) throwSupabaseError(error);
    return this.toEntity(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.adminClient
      .from('coupons')
      .delete()
      .eq('IdCoupons', id);
    if (error) throwSupabaseError(error);
  }

  async decrementQuantity(couponId: string): Promise<void> {
    const { error } = await this.supabase.adminClient.rpc(
      'decrement_coupon_quantity',
      { coupon_id: couponId },
    );
    if (error) throwSupabaseError(error);
  }
}
