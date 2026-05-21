import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IProductRepository } from '../domain/product.repository.interface.js';
import { PRODUCT_REPOSITORY } from '../domain/product.repository.interface.js';
import type { CreateProductDto } from '../dto/create-product.dto.js';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(data: CreateProductDto) {
    // ── Validaciones por tipo ──
    if (data.productType === 'single') {
      if (data.price == null) {
        throw new BadRequestException(
          'El precio es obligatorio para un producto único',
        );
      }
    }

    if (data.productType === 'multiple') {
      if (!data.styles || data.styles.length === 0) {
        throw new BadRequestException(
          'Se requiere al menos un estilo para un producto múltiple',
        );
      }
    }

    // ── 1. Crear producto base ──
    const product = await this.productRepository.create({
      name: data.name,
      productType: data.productType,
      price: data.productType === 'single' ? data.price : undefined,
      stock:
        data.productType === 'single' && !data.variants?.length
          ? (data.stock ?? 0)
          : undefined,
      sku:
        data.productType === 'single' && !data.variants?.length
          ? data.sku
          : undefined,
      description: data.description,
      specification: data.specification,
      sizeSystemId: data.sizeSystemId,
      categoryId: data.categoryId,
      statusId: data.statusId,
    });

    // ── 2. Single con variantes (tallas/colores directos) ──
    if (data.productType === 'single' && data.variants?.length) {
      for (const variant of data.variants) {
        await this.productRepository.createVariantForProduct(product.id, {
          sizeLabel: variant.sizeLabel,
          color: variant.color,
          price: variant.price,
          stock: variant.stock,
          sku: variant.sku,
        });
      }
    }

    // ── 3. Multiple: crear estilos + variantes por estilo ──
    if (data.productType === 'multiple' && data.styles) {
      for (let i = 0; i < data.styles.length; i++) {
        const styleDto = data.styles[i];
        const style = await this.productRepository.createStyle(product.id, {
          name: styleDto.name,
          colorHex: styleDto.colorHex,
          sortOrder: i,
        });

        for (const variantDto of styleDto.variants) {
          await this.productRepository.createVariantForStyle(style.id, {
            sizeLabel: variantDto.sizeLabel,
            price: variantDto.price,
            stock: variantDto.stock,
            sku: variantDto.sku,
          });
        }
      }
    }

    // ── 4. Retornar producto completo ──
    return this.productRepository.findById(product.id);
  }
}
