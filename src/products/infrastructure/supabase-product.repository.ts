import { Injectable } from '@nestjs/common';
import type { IProductRepository, CreateProductData, CreateVariantData } from '../domain/product.repository.interface.js';
import { Product } from '../domain/product.entity.js';
import { ProductImage } from '../domain/product-image.entity.js';
import { ProductVariant } from '../domain/product-variant.entity.js';
import { SupabaseService } from '../../supabase/supabase.service.js';
import { throwSupabaseError } from '../../common/exceptions/supabase-error.helper.js';

@Injectable()
export class SupabaseProductRepository implements IProductRepository {
  constructor(private readonly supabase: SupabaseService) {}

  // ── Mappers ──────────────────────────────────────

  private toEntity(
    data: Record<string, any>,
    images?: ProductImage[],
    variants?: ProductVariant[],
  ): Product {
    return new Product(
      data.IdProduct,
      data.NameProduct,
      Number(data.Price),
      data.Description,
      data.Specification,
      data.SizeType,
      data.IdCategorie,
      data.IdStatusProduct,
      images,
      variants,
    );
  }

  private toImageEntity(data: Record<string, any>): ProductImage {
    return new ProductImage(data.IdProductImage, data.url, data.IdProduct);
  }

  private toVariantEntity(data: Record<string, any>): ProductVariant {
    return new ProductVariant(
      data.IdVariant,
      data.IdProduct,
      data.size,
      data.color,
      data.stock,
      data.priceOverride ? Number(data.priceOverride) : null,
    );
  }

  // ── Product CRUD ─────────────────────────────────

  async findById(id: string): Promise<Product | null> {
    const { data, error } = await this.supabase.adminClient
      .from('product')
      .select('*')
      .eq('IdProduct', id)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throwSupabaseError(error);

    const images = await this.findImagesByProductId(id);
    const variants = await this.findVariantsByProductId(id);
    return this.toEntity(data, images, variants);
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

    // Para listado, cargamos variantes e imágenes de cada producto
    const products = await Promise.all(
      (data ?? []).map(async (d) => {
        const images = await this.findImagesByProductId(d.IdProduct);
        const variants = await this.findVariantsByProductId(d.IdProduct);
        return this.toEntity(d, images, variants);
      }),
    );

    return products;
  }

  async create(data: CreateProductData): Promise<Product> {
    const { data: created, error } = await this.supabase.adminClient
      .from('product')
      .insert({
        NameProduct: data.name,
        Price: data.price,
        Description: data.description,
        Specification: data.specification,
        SizeType: data.sizeType,
        IdCategorie: data.categoryId,
        IdStatusProduct: data.statusId,
        QuantityProduct: 0, // Stock se calcula desde variantes
      })
      .select()
      .single();

    if (error) throwSupabaseError(error);
    return this.toEntity(created);
  }

  async update(
    id: string,
    data: Partial<CreateProductData>,
  ): Promise<Product> {
    const payload: Record<string, any> = {};
    if (data.name !== undefined) payload['NameProduct'] = data.name;
    if (data.price !== undefined) payload['Price'] = data.price;
    if (data.description !== undefined) payload['Description'] = data.description;
    if (data.specification !== undefined) payload['Specification'] = data.specification;
    if (data.sizeType !== undefined) payload['SizeType'] = data.sizeType;
    if (data.categoryId !== undefined) payload['IdCategorie'] = data.categoryId;

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

    const images = await this.findImagesByProductId(id);
    const variants = await this.findVariantsByProductId(id);
    return this.toEntity(updated, images, variants);
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

  // ── Variantes ──────────────────────────────────

  async findVariantsByProductId(productId: string): Promise<ProductVariant[]> {
    const { data, error } = await this.supabase.adminClient
      .from('product_variant')
      .select('*')
      .eq('IdProduct', productId);

    if (error) throwSupabaseError(error);
    return (data ?? []).map((d) => this.toVariantEntity(d));
  }

  async createVariant(
    productId: string,
    input: CreateVariantData,
  ): Promise<ProductVariant> {
    const { data, error } = await this.supabase.adminClient
      .from('product_variant')
      .insert({
        IdProduct: productId,
        size: input.size ?? null,
        color: input.color ?? null,
        stock: input.stock,
        priceOverride: input.priceOverride ?? null,
      })
      .select()
      .single();

    if (error) throwSupabaseError(error);
    return this.toVariantEntity(data);
  }

  async updateVariant(
    variantId: string,
    input: Partial<CreateVariantData>,
  ): Promise<ProductVariant> {
    const payload: Record<string, any> = {};
    if (input.size !== undefined) payload['size'] = input.size;
    if (input.color !== undefined) payload['color'] = input.color;
    if (input.stock !== undefined) payload['stock'] = input.stock;
    if (input.priceOverride !== undefined) payload['priceOverride'] = input.priceOverride;

    const { data, error } = await this.supabase.adminClient
      .from('product_variant')
      .update(payload)
      .eq('IdVariant', variantId)
      .select()
      .single();

    if (error) throwSupabaseError(error);
    return this.toVariantEntity(data);
  }

  async deleteVariant(variantId: string): Promise<void> {
    const { error } = await this.supabase.adminClient
      .from('product_variant')
      .delete()
      .eq('IdVariant', variantId);
    if (error) throwSupabaseError(error);
  }

  async deleteAllVariants(productId: string): Promise<void> {
    const { error } = await this.supabase.adminClient
      .from('product_variant')
      .delete()
      .eq('IdProduct', productId);
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
