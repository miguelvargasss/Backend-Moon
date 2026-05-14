import { Injectable, Inject } from '@nestjs/common';
import type { ICouponRepository } from '../domain/coupon.repository.interface.js';
import { COUPON_REPOSITORY } from '../domain/coupon.repository.interface.js';

@Injectable()
export class DeleteCouponUseCase {
  constructor(
    @Inject(COUPON_REPOSITORY)
    private readonly couponRepository: ICouponRepository,
  ) {}

  async execute(id: string) {
    await this.couponRepository.delete(id);
  }
}
