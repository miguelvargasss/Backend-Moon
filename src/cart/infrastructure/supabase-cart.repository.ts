import { Injectable } from '@nestjs/common';
import { ICartRepository } from '../domain/cart.repository.interface.js';
import { CartItem } from '../domain/cart-item.entity.js';
import { SupabaseService } from '../../supabase/supabase.service.js';
import { throwSupabaseError } from '../../common/exceptions/supabase-error.helper.js';

@Injectable()
export class SupabaseCartRepository implements ICartRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Convierte un registro básico de shopping_cart a CartItem (sin enriquecer).
   */
  private toEntity(data: Record<string, any>): CartItem {
    return new CartItem(
      data.IdShoppingCart,
      data.IdUser,
      data.IdProduct,
      data.Quantity,
      data.IdVariant ?? null,
    );
  }

  /**
   * GET /cart — Retorna los ítems del carrito CON datos del producto ya enriquecidos.
   * Hace batch queries para evitar N+1 en el frontend.
   * Todas las queries se ejecutan en PARALELO con Promise.all.
   */
  async findByUserId(userId: string): Promise<CartItem[]> {
    const { data, error } = await this.supabase.adminClient
      .from('shopping_cart')
      .select('*')
      .eq('IdUser', userId);

    if (error) throwSupabaseError(error);
    if (!data?.length) return [];

    // Recopilar IDs únicos
    const productIds = [...new Set(data.map((d) => d.IdProduct))];
    const variantIds = data.map((d) => d.IdVariant).filter(Boolean);

    // ── Ejecutar TODAS las queries en paralelo ──
    const [productsRes, imagesRes, stylesRes, variantsRes] = await Promise.all([
      // 1. Productos (nombre + precio + tipo)
      this.supabase.adminClient
        .from('product')
        .select('*')
        .in('IdProduct', productIds),
      // 2. Imágenes directas de producto
      this.supabase.adminClient
        .from('product_image')
        .select('*')
        .in('IdProduct', productIds),
      // 3. Estilos de los productos
      this.supabase.adminClient
        .from('product_style')
        .select('*')
        .in('IdProduct', productIds),
      // 4. Variantes (si las hay)
      variantIds.length > 0
        ? this.supabase.adminClient
            .from('product_variant')
            .select('*')
            .in('IdVariant', variantIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const products = productsRes.data ?? [];
    const images = imagesRes.data ?? [];
    const styles = stylesRes.data ?? [];
    const variants = variantsRes.data ?? [];

    // Fetch imágenes de estilos en paralelo si hay estilos
    const styleIds = styles.map((s) => s.IdStyle);
    let styleImages: any[] = [];
    if (styleIds.length > 0) {
      const { data: sImgs } = await this.supabase.adminClient
        .from('product_image')
        .select('*')
        .in('IdStyle', styleIds);
      styleImages = sImgs ?? [];
    }

    // ── Crear Maps para lookup O(1) ──
    const productsMap = new Map(products.map((p) => [p.IdProduct, p]));
    const variantsMap = new Map(variants.map((v) => [v.IdVariant, v]));
    const stylesMap = new Map(styles.map((s) => [s.IdStyle, s]));

    // Map de imagen por producto (primera disponible)
    const productImageMap = new Map<string, string>();
    // Primero las directas
    for (const img of images) {
      if (img.IdProduct && !productImageMap.has(img.IdProduct)) {
        productImageMap.set(img.IdProduct, img.url);
      }
    }
    // Fallback: imágenes de estilos
    for (const style of styles) {
      if (!productImageMap.has(style.IdProduct)) {
        const sImg = styleImages.find((si) => si.IdStyle === style.IdStyle);
        if (sImg) productImageMap.set(style.IdProduct, sImg.url);
      }
    }

    // ── Mapear items con datos enriquecidos ──
    return data.map((d) => {
      const product = productsMap.get(d.IdProduct);
      const variant = d.IdVariant ? variantsMap.get(d.IdVariant) : null;

      // Precio: variante > producto
      const price = Number(variant?.price ?? product?.Price ?? 0);

      // Imagen
      const image = productImageMap.get(d.IdProduct) ?? null;

      // Variant info
      let variantLabel: string | null = null;
      let variantColor: string | null = null;
      if (variant) {
        variantLabel = variant.size_label ?? null;
        if (variant.IdStyle) {
          const style = stylesMap.get(variant.IdStyle);
          variantColor = style?.name ?? variant.color ?? null;
        } else {
          variantColor = variant.color ?? null;
        }
      }

      return new CartItem(
        d.IdShoppingCart,
        d.IdUser,
        d.IdProduct,
        d.Quantity,
        d.IdVariant ?? null,
        product?.NameProduct ?? 'Producto',
        price,
        image,
        variantLabel,
        variantColor,
      );
    });
  }

  async findExistingItem(
    userId: string,
    productId: string,
    variantId?: string | null,
  ): Promise<CartItem | null> {
    let query = this.supabase.adminClient
      .from('shopping_cart')
      .select('*')
      .eq('IdUser', userId)
      .eq('IdProduct', productId);

    if (variantId) {
      query = query.eq('IdVariant', variantId);
    } else {
      query = query.is('IdVariant', null);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throwSupabaseError(error);
    return data ? this.toEntity(data) : null;
  }

  async addItem(
    userId: string,
    productId: string,
    quantity: number,
    variantId?: string | null,
  ): Promise<CartItem> {
    const payload: Record<string, any> = {
      IdUser: userId,
      IdProduct: productId,
      Quantity: quantity,
    };
    if (variantId) payload.IdVariant = variantId;

    const { data, error } = await this.supabase.adminClient
      .from('shopping_cart')
      .insert(payload)
      .select()
      .single();
    if (error) throwSupabaseError(error);
    return this.toEntity(data);
  }

  async updateQuantity(
    cartItemId: string,
    quantity: number,
  ): Promise<CartItem> {
    const { data, error } = await this.supabase.adminClient
      .from('shopping_cart')
      .update({ Quantity: quantity })
      .eq('IdShoppingCart', cartItemId)
      .select()
      .single();
    if (error) throwSupabaseError(error);
    return this.toEntity(data);
  }

  async removeItem(cartItemId: string): Promise<void> {
    const { error } = await this.supabase.adminClient
      .from('shopping_cart')
      .delete()
      .eq('IdShoppingCart', cartItemId);
    if (error) throwSupabaseError(error);
  }

  async clearCart(userId: string): Promise<void> {
    const { error } = await this.supabase.adminClient
      .from('shopping_cart')
      .delete()
      .eq('IdUser', userId);
    if (error) throwSupabaseError(error);
  }
}
