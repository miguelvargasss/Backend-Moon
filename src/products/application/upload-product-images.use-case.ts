import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IProductRepository } from '../domain/product.repository.interface.js';
import { PRODUCT_REPOSITORY } from '../domain/product.repository.interface.js';
import { SupabaseService } from '../../supabase/supabase.service.js';

/**
 * CU04 — Subir imágenes de producto a Supabase Storage + registrar en product_image.
 * - Producto single → imagen asociada al producto (IdProduct)
 * - Producto multiple → imagen asociada al estilo (IdStyle via styleId param)
 */
@Injectable()
export class UploadProductImagesUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    private readonly supabase: SupabaseService,
  ) {}

  async execute(
    productId: string,
    file: Express.Multer.File,
    styleId?: string,
  ) {
    // Verificar que el producto existe
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    // Generar nombre único para el archivo
    const ext = file.originalname.split('.').pop();
    const folder = styleId ? `${productId}/${styleId}` : productId;
    const fileName = `${folder}/${Date.now()}.${ext}`;

    // Subir al bucket product-images de Supabase Storage
    const { error: uploadError } = await this.supabase.adminClient.storage
      .from('product-images')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Error subiendo imagen: ${uploadError.message}`);
    }

    // Obtener URL pública
    const { data: urlData } = this.supabase.adminClient.storage
      .from('product-images')
      .getPublicUrl(fileName);

    // Registrar en tabla product_image
    // single → IdProduct, multiple → IdStyle
    const image = await this.productRepository.addImage(
      styleId ? null : productId,
      styleId ?? null,
      urlData.publicUrl,
    );

    return image;
  }
}
