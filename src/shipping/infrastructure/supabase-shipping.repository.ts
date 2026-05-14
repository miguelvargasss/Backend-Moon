import { Injectable } from '@nestjs/common';
import { IShippingRepository } from '../domain/shipping.repository.interface.js';
import { ShippingAddress } from '../domain/shipping-address.entity.js';
import { SupabaseService } from '../../supabase/supabase.service.js';
import { throwSupabaseError } from '../../common/exceptions/supabase-error.helper.js';

@Injectable()
export class SupabaseShippingRepository implements IShippingRepository {
  constructor(private readonly supabase: SupabaseService) {}

  private toEntity(d: Record<string, any>): ShippingAddress {
    return new ShippingAddress(
      d.IdShippingAddress,
      d.IdUser,
      d.FirstName,
      d.LastName,
      d.Address,
      d.City,
      d.Region,
      d.Phone,
      d.Reference,
      d.CodeZip,
      d.DNI,
    );
  }

  async findByUserId(userId: string): Promise<ShippingAddress[]> {
    const { data, error } = await this.supabase.adminClient
      .from('shipping_address')
      .select('*')
      .eq('IdUser', userId);
    if (error) throwSupabaseError(error);
    return (data ?? []).map(this.toEntity.bind(this));
  }

  async findById(id: string): Promise<ShippingAddress | null> {
    const { data, error } = await this.supabase.adminClient
      .from('shipping_address')
      .select('*')
      .eq('IdShippingAddress', id)
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throwSupabaseError(error);
    return this.toEntity(data);
  }

  async create(
    addressData: Omit<ShippingAddress, 'id'>,
  ): Promise<ShippingAddress> {
    const { data, error } = await this.supabase.adminClient
      .from('shipping_address')
      .insert({
        IdUser: addressData.userId,
        FirstName: addressData.firstName,
        LastName: addressData.lastName,
        Address: addressData.address,
        City: addressData.city,
        Region: addressData.region,
        Phone: addressData.phone,
        Reference: addressData.reference,
        CodeZip: addressData.codeZip,
        DNI: addressData.dni,
      })
      .select()
      .single();
    if (error) throwSupabaseError(error);
    return this.toEntity(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.adminClient
      .from('shipping_address')
      .delete()
      .eq('IdShippingAddress', id);
    if (error) throwSupabaseError(error);
  }
}
