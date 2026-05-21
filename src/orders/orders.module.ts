import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { CreateOrderUseCase } from './application/create-order.use-case.js';
import { GetOrderUseCase } from './application/get-order.use-case.js';
import { ListOrdersUseCase } from './application/list-orders.use-case.js';
import { GetOrderDetailUseCase } from './application/get-order-detail.use-case.js';
import { ListAllOrdersUseCase } from './application/list-all-orders.use-case.js';
import { UpdateOrderStatusUseCase } from './application/update-order-status.use-case.js';
import { ListStatusesUseCase } from './application/list-statuses.use-case.js';
import { SupabaseOrderRepository } from './infrastructure/supabase-order.repository.js';
import { ORDER_REPOSITORY } from './domain/order.repository.interface.js';
import { CartModule } from '../cart/cart.module.js';
import { ProductsModule } from '../products/products.module.js';
import { CouponsModule } from '../coupons/coupons.module.js';
import { ShippingModule } from '../shipping/shipping.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    CartModule,
    ProductsModule,
    CouponsModule,
    ShippingModule,
    UsersModule,
  ],
  controllers: [OrdersController],
  providers: [
    CreateOrderUseCase,
    GetOrderUseCase,
    ListOrdersUseCase,
    GetOrderDetailUseCase,
    ListAllOrdersUseCase,
    UpdateOrderStatusUseCase,
    ListStatusesUseCase,
    { provide: ORDER_REPOSITORY, useClass: SupabaseOrderRepository },
  ],
})
export class OrdersModule {}
