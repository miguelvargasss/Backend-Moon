import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ICouponRepository } from '../domain/coupon.repository.interface.js';
import { COUPON_REPOSITORY } from '../domain/coupon.repository.interface.js';

@Injectable()
export class UpdateCouponUseCase {
  constructor(
    @Inject(COUPON_REPOSITORY)
    private readonly couponRepository: ICouponRepository,
  ) {}

  async execute(
    id: string,
    data: {
      code?: string;
      expirationDate?: Date;
      couponQuantity?: number;
      minimumAmount?: number;
      discountAmount?: number;
      categoryId?: string;
    },
  ) {
    const updated = await this.couponRepository.update(id, data);
    if (!updated) {
      throw new NotFoundException('Cupón no encontrado');
    }
    return updated;
  }
}
