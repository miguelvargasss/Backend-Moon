import { Module } from '@nestjs/common';
import { CouponsController } from './coupons.controller.js';
import { ValidateCouponUseCase } from './application/validate-coupon.use-case.js';
import { CreateCouponUseCase } from './application/create-coupon.use-case.js';
import { ListCouponsUseCase } from './application/list-coupons.use-case.js';
import { UpdateCouponUseCase } from './application/update-coupon.use-case.js';
import { DeleteCouponUseCase } from './application/delete-coupon.use-case.js';
import { SupabaseCouponRepository } from './infrastructure/supabase-coupon.repository.js';
import { COUPON_REPOSITORY } from './domain/coupon.repository.interface.js';
import { CartModule } from '../cart/cart.module.js';
import { ProductsModule } from '../products/products.module.js';

@Module({
  imports: [CartModule, ProductsModule],
  controllers: [CouponsController],
  providers: [
    ValidateCouponUseCase,
    CreateCouponUseCase,
    ListCouponsUseCase,
    UpdateCouponUseCase,
    DeleteCouponUseCase,
    { provide: COUPON_REPOSITORY, useClass: SupabaseCouponRepository },
  ],
  exports: [
    ValidateCouponUseCase,
    { provide: COUPON_REPOSITORY, useClass: SupabaseCouponRepository },
  ],
})
export class CouponsModule {}
