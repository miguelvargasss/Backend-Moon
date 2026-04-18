import { Injectable, Inject, ConflictException } from '@nestjs/common';
import type { ICouponRepository } from '../domain/coupon.repository.interface.js';
import { COUPON_REPOSITORY } from '../domain/coupon.repository.interface.js';
import { Coupon } from '../domain/coupon.entity.js';

/**
 * CU05 — Admin crea cupón.
 * Verifica que el código no exista antes de crear.
 */
@Injectable()
export class CreateCouponUseCase {
  constructor(
    @Inject(COUPON_REPOSITORY)
    private readonly couponRepository: ICouponRepository,
  ) {}

  async execute(
    data: Omit<Coupon, 'id' | 'isValid' | 'isExpired' | 'hasStock'>,
  ) {
    // Verificar código duplicado
    const existing = await this.couponRepository.findByCode(data.code);
    if (existing) {
      throw new ConflictException(
        'El código de cupón ya existe. Ingresa un código diferente.',
      );
    }

    return this.couponRepository.create(data);
  }
}
