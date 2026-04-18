import { Module } from '@nestjs/common';
import { ShippingController } from './shipping.controller.js';
import { AddShippingAddressUseCase } from './application/add-shipping-address.use-case.js';
import { ListShippingAddressesUseCase } from './application/list-shipping-addresses.use-case.js';
import { DeleteShippingAddressUseCase } from './application/delete-shipping-address.use-case.js';
import { SupabaseShippingRepository } from './infrastructure/supabase-shipping.repository.js';
import { SHIPPING_REPOSITORY } from './domain/shipping.repository.interface.js';

@Module({
  controllers: [ShippingController],
  providers: [
    AddShippingAddressUseCase,
    ListShippingAddressesUseCase,
    DeleteShippingAddressUseCase,
    { provide: SHIPPING_REPOSITORY, useClass: SupabaseShippingRepository },
  ],
  exports: [
    { provide: SHIPPING_REPOSITORY, useClass: SupabaseShippingRepository },
  ],
})
export class ShippingModule {}
