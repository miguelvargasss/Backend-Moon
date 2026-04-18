import { Coupon } from './coupon.entity.js';

export const COUPON_REPOSITORY = 'COUPON_REPOSITORY';

export interface ICouponRepository {
  findByCode(code: string): Promise<Coupon | null>;
  findAll(): Promise<Coupon[]>;
  create(data: Omit<Coupon, 'id' | 'isValid' | 'isExpired' | 'hasStock'>): Promise<Coupon>;
  decrementQuantity(couponId: string): Promise<void>;
}
