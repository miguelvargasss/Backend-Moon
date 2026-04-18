import { ShippingAddress } from './shipping-address.entity.js';

export const SHIPPING_REPOSITORY = 'SHIPPING_REPOSITORY';

export interface IShippingRepository {
  findByUserId(userId: string): Promise<ShippingAddress[]>;
  findById(id: string): Promise<ShippingAddress | null>;
  create(data: Omit<ShippingAddress, 'id'>): Promise<ShippingAddress>;
  delete(id: string): Promise<void>;
}
