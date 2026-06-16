import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { type IProductRepository, PRODUCT_REPOSITORY } from '../domain/product.repository.interface.js';
import type { CreateProductDto } from '../dto/create-product.dto.js';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(data: CreateProductDto) {
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

    if (data.productType === 'single' && data.variants?.length) {
      await this.createSingleProductVariants(product.id, data.variants);
    }

    if (data.productType === 'multiple' && data.styles) {
      await this.createMultipleProductStyles(product.id, data.styles);
    }

    return this.productRepository.findById(product.id);
  }

  private async createSingleProductVariants(productId: string, variants: any[]) {
    for (const variant of variants) {
      await this.productRepository.createVariantForProduct(productId, {
        sizeLabel: variant.sizeLabel,
        color: variant.color,
        price: variant.price,
        stock: variant.stock,
        sku: variant.sku,
      });
    }
  }

  private async createMultipleProductStyles(productId: string, styles: any[]) {
    for (let i = 0; i < styles.length; i++) {
      const styleDto = styles[i];
      const style = await this.productRepository.createStyle(productId, {
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
}
