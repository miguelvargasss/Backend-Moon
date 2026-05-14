import { Coupon } from './coupon.entity.js';

export const COUPON_REPOSITORY = 'COUPON_REPOSITORY';

export interface ICouponRepository {
  findByCode(code: string): Promise<Coupon | null>;
  findAll(): Promise<Coupon[]>;
  create(
    data: Omit<Coupon, 'id' | 'isValid' | 'isExpired' | 'hasStock'>,
  ): Promise<Coupon>;
  update(
    id: string,
    data: Partial<Omit<Coupon, 'id' | 'isValid' | 'isExpired' | 'hasStock'>>,
  ): Promise<Coupon>;
  delete(id: string): Promise<void>;
  decrementQuantity(couponId: string): Promise<void>;
}
