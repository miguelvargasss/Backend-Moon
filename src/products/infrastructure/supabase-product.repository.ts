import { Injectable } from '@nestjs/common';
import { IProductRepository } from '../domain/product.repository.interface.js';
import { Product } from '../domain/product.entity.js';
import { ProductImage } from '../domain/product-image.entity.js';
import { SupabaseService } from '../../supabase/supabase.service.js';
import { throwSupabaseError } from '../../common/exceptions/supabase-error.helper.js';

@Injectable()
export class SupabaseProductRepository implements IProductRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /** Mapea un registro de Supabase a la entidad de dominio Product */
  private toEntity(data: Record<string, any>, images?: ProductImage[]): Product {
    return new Product(
      data.IdProduct,
      data.NameProduct,
      data.QuantityProduct,
      data.Price,
      data.IdCategorie,
      data.IdStatusProduct,
      data.Color,
      data.Size,
      data.Specification,
      images,
    );
  }

  /** Mapea un registro de product_image a ProductImage */
  private toImageEntity(data: Record<string, any>): ProductImage {
    return new ProductImage(data.IdProductImage, data.url, data.IdProduct);
  }

  async findById(id: string): Promise<Product | null> {
    const { data, error } = await this.supabase.adminClient
      .from('product')
      .select('*')
      .eq('IdProduct', id)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throwSupabaseError(error);

    // Obtener imágenes asociadas
    const images = await this.findImagesByProductId(id);
    return this.toEntity(data, images);
  }

  async findAll(filters?: {
    categoryId?: string;
    statusId?: string;
  }): Promise<Product[]> {
    let query = this.supabase.adminClient.from('product').select('*');

    if (filters?.categoryId)
      query = query.eq('IdCategorie', filters.categoryId);
    if (filters?.statusId)
      query = query.eq('IdStatusProduct', filters.statusId);

    const { data, error } = await query;
    if (error) throwSupabaseError(error);
    return (data ?? []).map((d) => this.toEntity(d));
  }

  async create(
    data: Omit<Product, 'id' | 'isInStock' | 'images'>,
  ): Promise<Product> {
    const { data: created, error } = await this.supabase.adminClient
      .from('product')
      .insert({
        NameProduct: data.name,
        QuantityProduct: data.quantity,
        Price: data.price,
        IdCategorie: data.categoryId,
        IdStatusProduct: data.statusId,
        Color: data.color,
        Size: data.size,
        Specification: data.specification,
      })
      .select()
      .single();

    if (error) throwSupabaseError(error);
    return this.toEntity(created);
  }

  async update(
    id: string,
    data: Partial<Omit<Product, 'id' | 'isInStock' | 'images'>>,
  ): Promise<Product> {
    // Construir payload mapeando propiedades del dominio a columnas de BD
    const payload: Record<string, any> = {};
    if (data.name !== undefined) payload['NameProduct'] = data.name;
    if (data.quantity !== undefined) payload['QuantityProduct'] = data.quantity;
    if (data.price !== undefined) payload['Price'] = data.price;
    if (data.categoryId !== undefined) payload['IdCategorie'] = data.categoryId;
    if (data.color !== undefined) payload['Color'] = data.color;
    if (data.size !== undefined) payload['Size'] = data.size;
    if (data.specification !== undefined)
      payload['Specification'] = data.specification;

    // Soft-delete: si statusId es '__INACTIVE__', buscar el status "inactivo"
    if (data.statusId === '__INACTIVE__') {
      const { data: status } = await this.supabase.adminClient
        .from('statusProduct')
        .select('IdStatusProduct')
        .eq('nameStatusProduct', 'inactivo')
        .single();
      if (status) payload['IdStatusProduct'] = status.IdStatusProduct;
    } else if (data.statusId !== undefined) {
      payload['IdStatusProduct'] = data.statusId;
    }

    const { data: updated, error } = await this.supabase.adminClient
      .from('product')
      .update(payload)
      .eq('IdProduct', id)
      .select()
      .single();

    if (error) throwSupabaseError(error);
    return this.toEntity(updated);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.adminClient
      .from('product')
      .delete()
      .eq('IdProduct', id);
    if (error) throwSupabaseError(error);
  }

  // ── Imágenes ──────────────────────────────────

  async findImagesByProductId(productId: string): Promise<ProductImage[]> {
    const { data, error } = await this.supabase.adminClient
      .from('product_image')
      .select('*')
      .eq('IdProduct', productId);

    if (error) throwSupabaseError(error);
    return (data ?? []).map((d) => this.toImageEntity(d));
  }

  async addImage(productId: string, url: string): Promise<ProductImage> {
    const { data, error } = await this.supabase.adminClient
      .from('product_image')
      .insert({ IdProduct: productId, url })
      .select()
      .single();

    if (error) throwSupabaseError(error);
    return this.toImageEntity(data);
  }

  async removeImage(imageId: string): Promise<void> {
    const { error } = await this.supabase.adminClient
      .from('product_image')
      .delete()
      .eq('IdProductImage', imageId);
    if (error) throwSupabaseError(error);
  }

  // ── Historial (CU04) ──────────────────────────

  async hasOrderHistory(productId: string): Promise<boolean> {
    const { count, error } = await this.supabase.adminClient
      .from('order_item')
      .select('*', { count: 'exact', head: true })
      .eq('IdProduct', productId);

    if (error) throwSupabaseError(error);
    return (count ?? 0) > 0;
  }
}
