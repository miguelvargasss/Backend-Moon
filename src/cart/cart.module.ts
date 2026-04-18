import { Module } from '@nestjs/common';
import { CartController } from './cart.controller.js';
import { AddToCartUseCase } from './application/add-to-cart.use-case.js';
import { GetCartUseCase } from './application/get-cart.use-case.js';
import { RemoveFromCartUseCase } from './application/remove-from-cart.use-case.js';
import { UpdateCartItemUseCase } from './application/update-cart-item.use-case.js';
import { ClearCartUseCase } from './application/clear-cart.use-case.js';
import { SupabaseCartRepository } from './infrastructure/supabase-cart.repository.js';
import { CART_REPOSITORY } from './domain/cart.repository.interface.js';
import { ProductsModule } from '../products/products.module.js';

@Module({
  imports: [ProductsModule],
  controllers: [CartController],
  providers: [
    AddToCartUseCase,
    GetCartUseCase,
    RemoveFromCartUseCase,
    UpdateCartItemUseCase,
    ClearCartUseCase,
    { provide: CART_REPOSITORY, useClass: SupabaseCartRepository },
  ],
  exports: [
    GetCartUseCase,
    ClearCartUseCase,
    { provide: CART_REPOSITORY, useClass: SupabaseCartRepository },
  ],
})
export class CartModule {}
