import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IProductRepository } from '../domain/product.repository.interface.js';
import { PRODUCT_REPOSITORY } from '../domain/product.repository.interface.js';
import { SupabaseService } from '../../supabase/supabase.service.js';

/**
 * CU04 — Subir imágenes de producto a Supabase Storage + registrar en product_image.
 */
@Injectable()
export class UploadProductImagesUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    private readonly supabase: SupabaseService,
  ) {}

  async execute(productId: string, file: Express.Multer.File) {
    // Verificar que el producto existe
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    // Generar nombre único para el archivo
    const ext = file.originalname.split('.').pop();
    const fileName = `${productId}/${Date.now()}.${ext}`;

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
    const image = await this.productRepository.addImage(
      productId,
      urlData.publicUrl,
    );

    return image;
  }
}
