import { Injectable, Inject, ConflictException, BadRequestException } from '@nestjs/common';
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
    // Validar código máximo 25 caracteres (doble check)
    if (data.code.length > 25) {
      throw new BadRequestException('El código del cupón no debe exceder los 25 caracteres.');
    }

    // Validar que la fecha de expiración sea estrictamente HOY
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(data.expirationDate);
    expDate.setHours(0, 0, 0, 0);

    // Comparar ISO strings para evitar desfases de zona horaria simples
    const todayISO = today.toISOString().split('T')[0];
    const expISO = expDate.toISOString().split('T')[0];

    if (expISO !== todayISO) {
      throw new BadRequestException('La fecha de expiración debe ser estrictamente la fecha de hoy.');
    }

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
