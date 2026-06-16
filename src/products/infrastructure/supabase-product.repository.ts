import { Injectable } from '@nestjs/common';
import type {
  IProductRepository,
  CreateProductData,
  CreateVariantData,
  CreateStyleData,
  SizeSystem,
  SizeOption,
} from '../domain/product.repository.interface.js';
import { Product } from '../domain/product.entity.js';
import { ProductImage } from '../domain/product-image.entity.js';
import { ProductVariant } from '../domain/product-variant.entity.js';
import { ProductStyle } from '../domain/product-style.entity.js';
import { SupabaseService } from '../../supabase/supabase.service.js';
import { throwSupabaseError } from '../../common/exceptions/supabase-error.helper.js';

@Injectable()
export class SupabaseProductRepository implements IProductRepository {
  constructor(private readonly supabase: SupabaseService) {}

  // ── Mappers ──────────────────────────────────────

  async getStatuses(): Promise<{ id: string; name: string }[]> {
    const { data, error } = await this.supabase.adminClient
      .from('statusProduct')
      .select('IdStatusProduct, nameStatusProduct');

    if (error) throwSupabaseError(error);

    return (data ?? []).map((status) => ({
      id: status.IdStatusProduct,
      name: status.nameStatusProduct,
    }));
  }

  private toImageEntity(data: Record<string, any>): ProductImage {
    return new ProductImage(
      data.IdProductImage,
      data.url,
      data.IdProduct ?? null,
      data.IdStyle ?? null,
      data.sort_order ?? 0,
    );
  }

  private toVariantEntity(data: Record<string, any>): ProductVariant {
    return new ProductVariant(
      data.IdVariant,
      data.IdProduct ?? null,
      data.IdStyle ?? null,
      data.size_label ?? null,
      data.color ?? null,
      Number(data.price),
      data.stock,
      data.sku ?? null,
    );
  }

  private toStyleEntity(
    data: Record<string, any>,
    images: ProductImage[] = [],
    variants: ProductVariant[] = [],
  ): ProductStyle {
    return new ProductStyle(
      data.IdStyle,
      data.IdProduct,
      data.name,
      data.color_hex ?? null,
      data.sort_order ?? 0,
      images,
      variants,
    );
  }

  private toEntity(
    data: Record<string, any>,
    images: ProductImage[] = [],
    variants: ProductVariant[] = [],
    styles: ProductStyle[] = [],
  ): Product {
    return new Product(
      data.IdProduct,
      data.NameProduct,
      data.product_type ?? 'single',
      data.Price == null ? null : Number(data.Price),
      data.stock == null ? null : Number(data.stock),
      data.sku ?? null,
      data.Description,
      data.Specification,
      data.size_system_id ?? undefined,
      data.IdCategorie,
      data.IdStatusProduct,
      images,
      variants,
      styles,
    );
  }

  // ── Helpers ──────────────────────────────────────

  private async loadFullProduct(
    productData: Record<string, any>,
  ): Promise<Product> {
    const productId = productData.IdProduct;
    const productType = productData.product_type ?? 'single';

    if (productType === 'single') {
      return this.loadSingleProduct(productData, productId);
    }
    return this.loadMultipleProduct(productData, productId);
  }

  private async loadSingleProduct(
    productData: Record<string, any>,
    productId: string,
  ): Promise<Product> {
    // Imágenes directas del producto
    const images = await this.findImagesByProductId(productId);
    // Variantes directas del producto
    const variants = await this.findVariantsByProductId(productId);

    return this.toEntity(productData, images, variants, []);
  }

  private async loadMultipleProduct(
    productData: Record<string, any>,
    productId: string,
  ): Promise<Product> {
    // Cargar estilos
    const rawStyles = await this.findRawStylesByProductId(productId);
    // Cargar todas las imágenes de estilos
    const allStyleImages = await this.findImagesByStyles(
      rawStyles.map((s) => s.IdStyle),
    );
    // Cargar todas las variantes de estilos
    const allStyleVariants = await this.findVariantsByStyles(
      rawStyles.map((s) => s.IdStyle),
    );

    const styles = rawStyles.map((raw) => {
      const sImages = allStyleImages.filter(
        (img) => img.styleId === raw.IdStyle,
      );
      const sVariants = allStyleVariants.filter(
        (v) => v.styleId === raw.IdStyle,
      );
      return this.toStyleEntity(raw, sImages, sVariants);
    });

    return this.toEntity(productData, [], [], styles);
  }

  // ── Raw queries ──────────────────────────────────

  private async findRawStylesByProductId(
    productId: string,
  ): Promise<Record<string, any>[]> {
    const { data, error } = await this.supabase.adminClient
      .from('product_style')
      .select('*')
      .eq('IdProduct', productId)
      .order('sort_order');

    if (error) throwSupabaseError(error);
    return data ?? [];
  }

  private async findImagesByProductId(
    productId: string,
  ): Promise<ProductImage[]> {
    const { data, error } = await this.supabase.adminClient
      .from('product_image')
      .select('*')
      .eq('IdProduct', productId)
      .order('sort_order');

    if (error) throwSupabaseError(error);
    return (data ?? []).map((d) => this.toImageEntity(d));
  }

  private async findImagesByStyles(
    styleIds: string[],
  ): Promise<ProductImage[]> {
    if (styleIds.length === 0) return [];
    const { data, error } = await this.supabase.adminClient
      .from('product_image')
      .select('*')
      .in('IdStyle', styleIds)
      .order('sort_order');

    if (error) throwSupabaseError(error);
    return (data ?? []).map((d) => this.toImageEntity(d));
  }

  private async findVariantsByProductId(
    productId: string,
  ): Promise<ProductVariant[]> {
    const { data, error } = await this.supabase.adminClient
      .from('product_variant')
      .select('*')
      .eq('IdProduct', productId);

    if (error) throwSupabaseError(error);
    return (data ?? []).map((d) => this.toVariantEntity(d));
  }

  private async findVariantsByStyles(
    styleIds: string[],
  ): Promise<ProductVariant[]> {
    if (styleIds.length === 0) return [];
    const { data, error } = await this.supabase.adminClient
      .from('product_variant')
      .select('*')
      .in('IdStyle', styleIds);

    if (error) throwSupabaseError(error);
    return (data ?? []).map((d) => this.toVariantEntity(d));
  }

  // ── Product CRUD ─────────────────────────────────

  async findById(id: string): Promise<Product | null> {
    const { data, error } = await this.supabase.adminClient
      .from('product')
      .select('*')
      .eq('IdProduct', id)
      .single();

    if (error?.code === 'PGRST116') return null;
    if (error) throwSupabaseError(error);

    return this.loadFullProduct(data);
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
    if (!data?.length) return [];

    const productIds = data.map((d) => d.IdProduct);

    // ── Batch: carga de relaciones en paralelo (3 queries en vez de N*3) ──
    const [allImagesRes, allVariantsRes, allStylesRes] = await Promise.all([
      this.supabase.adminClient
        .from('product_image')
        .select('*')
        .in('IdProduct', productIds)
        .order('sort_order'),
      this.supabase.adminClient
        .from('product_variant')
        .select('*')
        .in('IdProduct', productIds),
      this.supabase.adminClient
        .from('product_style')
        .select('*')
        .in('IdProduct', productIds)
        .order('sort_order'),
    ]);

    const allImages = (allImagesRes.data ?? []).map((d) =>
      this.toImageEntity(d),
    );
    const allVariants = (allVariantsRes.data ?? []).map((d) =>
      this.toVariantEntity(d),
    );
    const allStyles = allStylesRes.data ?? [];

    // ── Cargar datos de estilos (imágenes + variantes) si existen ──
    const allStyleIds = allStyles.map((s) => s.IdStyle);
    let styleImages: ProductImage[] = [];
    let styleVariants: ProductVariant[] = [];

    if (allStyleIds.length > 0) {
      const [sImgsRes, sVarsRes] = await Promise.all([
        this.supabase.adminClient
          .from('product_image')
          .select('*')
          .in('IdStyle', allStyleIds)
          .order('sort_order'),
        this.supabase.adminClient
          .from('product_variant')
          .select('*')
          .in('IdStyle', allStyleIds),
      ]);
      styleImages = (sImgsRes.data ?? []).map((d) => this.toImageEntity(d));
      styleVariants = (sVarsRes.data ?? []).map((d) => this.toVariantEntity(d));
    }

    // ── Ensamblar productos en memoria ──
    return data.map((d) => {
      const productId = d.IdProduct;
      const productType = d.product_type ?? 'single';

      if (productType === 'multiple') {
        // Ensamblar estilos con sus imágenes y variantes
        const pStyles = allStyles
          .filter((s) => s.IdProduct === productId)
          .map((raw) => {
            const sImages = styleImages.filter(
              (img) => img.styleId === raw.IdStyle,
            );
            const sVars = styleVariants.filter(
              (v) => v.styleId === raw.IdStyle,
            );
            return this.toStyleEntity(raw, sImages, sVars);
          });
        return this.toEntity(d, [], [], pStyles);
      }

      // Single: imágenes y variantes directas
      const pImages = allImages.filter((img) => img.productId === productId);
      const pVariants = allVariants.filter((v) => v.productId === productId);
      return this.toEntity(d, pImages, pVariants, []);
    });
  }

  async create(data: CreateProductData): Promise<Product> {
    const insertData: Record<string, any> = {
      NameProduct: data.name,
      product_type: data.productType,
      Description: data.description,
      Specification: data.specification,
      IdCategorie: data.categoryId,
      IdStatusProduct: data.statusId,
      size_system_id: data.sizeSystemId ?? null,
    };

    // Solo agregar precio/stock/sku si es single
    if (data.productType === 'single') {
      insertData['Price'] = data.price ?? 0;
      insertData['stock'] = data.stock ?? 0;
      insertData['sku'] = data.sku ?? null;
    }

    const { data: created, error } = await this.supabase.adminClient
      .from('product')
      .insert(insertData)
      .select()
      .single();

    if (error) throwSupabaseError(error);
    return this.toEntity(created);
  }

  async update(id: string, data: Partial<CreateProductData>): Promise<Product> {
    const payload: Record<string, any> = {};
    if (data.name !== undefined) payload['NameProduct'] = data.name;
    if (data.price !== undefined) payload['Price'] = data.price;
    if (data.stock !== undefined) payload['stock'] = data.stock;
    if (data.sku !== undefined) payload['sku'] = data.sku;
    if (data.description !== undefined)
      payload['Description'] = data.description;
    if (data.specification !== undefined)
      payload['Specification'] = data.specification;
    if (data.sizeSystemId !== undefined)
      payload['size_system_id'] = data.sizeSystemId;
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

    return this.loadFullProduct(updated);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.adminClient
      .from('product')
      .delete()
      .eq('IdProduct', id);
    if (error) throwSupabaseError(error);
  }

  // ── Imágenes ──────────────────────────────────

  async addImage(
    productId: string | null,
    styleId: string | null,
    url: string,
  ): Promise<ProductImage> {
    const insertData: Record<string, any> = { url };
    if (productId) insertData['IdProduct'] = productId;
    if (styleId) insertData['IdStyle'] = styleId;

    const { data, error } = await this.supabase.adminClient
      .from('product_image')
      .insert(insertData)
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

  // ── Estilos ──────────────────────────────────

  async createStyle(
    productId: string,
    data: CreateStyleData,
  ): Promise<ProductStyle> {
    const { data: created, error } = await this.supabase.adminClient
      .from('product_style')
      .insert({
        IdProduct: productId,
        name: data.name,
        color_hex: data.colorHex ?? null,
        sort_order: data.sortOrder ?? 0,
      })
      .select()
      .single();

    if (error) throwSupabaseError(error);
    return this.toStyleEntity(created);
  }

  async deleteStyle(styleId: string): Promise<void> {
    const { error } = await this.supabase.adminClient
      .from('product_style')
      .delete()
      .eq('IdStyle', styleId);
    if (error) throwSupabaseError(error);
  }

  async deleteAllStyles(productId: string): Promise<void> {
    const { error } = await this.supabase.adminClient
      .from('product_style')
      .delete()
      .eq('IdProduct', productId);
    if (error) throwSupabaseError(error);
  }

  // ── Variantes ──────────────────────────────────

  async createVariantForProduct(
    productId: string,
    input: CreateVariantData,
  ): Promise<ProductVariant> {
    const { data, error } = await this.supabase.adminClient
      .from('product_variant')
      .insert({
        IdProduct: productId,
        IdStyle: null,
        size_label: input.sizeLabel ?? null,
        color: input.color ?? null,
        price: input.price,
        stock: input.stock,
        sku: input.sku ?? null,
      })
      .select()
      .single();

    if (error) throwSupabaseError(error);
    return this.toVariantEntity(data);
  }

  async createVariantForStyle(
    styleId: string,
    input: CreateVariantData,
  ): Promise<ProductVariant> {
    const { data, error } = await this.supabase.adminClient
      .from('product_variant')
      .insert({
        IdProduct: null,
        IdStyle: styleId,
        size_label: input.sizeLabel ?? null,
        color: input.color ?? null,
        price: input.price,
        stock: input.stock,
        sku: input.sku ?? null,
      })
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

  async deleteAllVariantsByProduct(productId: string): Promise<void> {
    const { error } = await this.supabase.adminClient
      .from('product_variant')
      .delete()
      .eq('IdProduct', productId);
    if (error) throwSupabaseError(error);
  }

  async deleteAllVariantsByStyle(styleId: string): Promise<void> {
    const { error } = await this.supabase.adminClient
      .from('product_variant')
      .delete()
      .eq('IdStyle', styleId);
    if (error) throwSupabaseError(error);
  }

  // ── Catálogo de tallas ──────────────────────────

  async getSizeSystems(): Promise<SizeSystem[]> {
    const { data: systems, error } = await this.supabase.adminClient
      .from('size_system')
      .select('*')
      .order('name');

    if (error) throwSupabaseError(error);

    const { data: options, error: optError } = await this.supabase.adminClient
      .from('size_option')
      .select('*')
      .order('sort_order');

    if (optError) throwSupabaseError(optError);

    return (systems ?? []).map((sys) => ({
      id: sys.id,
      name: sys.name,
      options: (options ?? [])
        .filter((o) => o.size_system_id === sys.id)
        .map((o) => ({ id: o.id, label: o.label, sortOrder: o.sort_order })),
    }));
  }

  async createSizeSystem(name: string): Promise<SizeSystem> {
    const { data, error } = await this.supabase.adminClient
      .from('size_system')
      .insert({ name })
      .select()
      .single();

    if (error) throwSupabaseError(error);
    return { id: data.id, name: data.name, options: [] };
  }

  async updateSizeSystem(id: string, name: string): Promise<SizeSystem> {
    const { data, error } = await this.supabase.adminClient
      .from('size_system')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) throwSupabaseError(error);

    // Re-cargar opciones
    const { data: options } = await this.supabase.adminClient
      .from('size_option')
      .select('*')
      .eq('size_system_id', id)
      .order('sort_order');

    return {
      id: data.id,
      name: data.name,
      options: (options ?? []).map((o) => ({
        id: o.id,
        label: o.label,
        sortOrder: o.sort_order,
      })),
    };
  }

  async deleteSizeSystem(id: string): Promise<void> {
    const { error } = await this.supabase.adminClient
      .from('size_system')
      .delete()
      .eq('id', id);
    if (error) throwSupabaseError(error);
  }

  async addSizeOption(
    systemId: string,
    label: string,
    sortOrder?: number,
  ): Promise<SizeOption> {
    const { data, error } = await this.supabase.adminClient
      .from('size_option')
      .insert({
        size_system_id: systemId,
        label,
        sort_order: sortOrder ?? 0,
      })
      .select()
      .single();

    if (error) throwSupabaseError(error);
    return { id: data.id, label: data.label, sortOrder: data.sort_order };
  }

  async deleteSizeOption(optionId: string): Promise<void> {
    const { error } = await this.supabase.adminClient
      .from('size_option')
      .delete()
      .eq('id', optionId);
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

  // ── Decremento de stock al confirmar pedido ───
  // Nota: estos métodos no son atómicos contra concurrencia.
  // En producción de alta concurrencia conviene mover a una RPC con SELECT ... FOR UPDATE.

  async decrementProductStock(
    productId: string,
    quantity: number,
  ): Promise<void> {
    // Leer stock actual
    const { data: current, error: readErr } = await this.supabase.adminClient
      .from('product')
      .select('stock')
      .eq('IdProduct', productId)
      .single();
    if (readErr) throwSupabaseError(readErr);

    const newStock = Math.max(0, Number(current?.stock ?? 0) - quantity);

    const { error } = await this.supabase.adminClient
      .from('product')
      .update({ stock: newStock })
      .eq('IdProduct', productId);
    if (error) throwSupabaseError(error);
  }

  async decrementVariantStock(
    variantId: string,
    quantity: number,
  ): Promise<void> {
    const { data: current, error: readErr } = await this.supabase.adminClient
      .from('product_variant')
      .select('stock')
      .eq('IdVariant', variantId)
      .single();
    if (readErr) throwSupabaseError(readErr);

    const newStock = Math.max(0, Number(current?.stock ?? 0) - quantity);

    const { error } = await this.supabase.adminClient
      .from('product_variant')
      .update({ stock: newStock })
      .eq('IdVariant', variantId);
    if (error) throwSupabaseError(error);
  }
}
