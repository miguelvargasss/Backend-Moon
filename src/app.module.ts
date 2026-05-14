import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { ProductsModule } from './products/products.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { CartModule } from './cart/cart.module.js';
import { CouponsModule } from './coupons/coupons.module.js';
import { ShippingModule } from './shipping/shipping.module.js';
import { AppController } from './app.controller.js';

@Module({
  imports: [
    // Configuración global — carga variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Infraestructura compartida
    SupabaseModule,

    // Módulos de dominio de negocio
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    CartModule,
    CouponsModule,
    ShippingModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
