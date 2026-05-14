import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type {
  IProductRepository,
  CreateProductData,
} from '../domain/product.repository.interface.js';
import { PRODUCT_REPOSITORY } from '../domain/product.repository.interface.js';
import type {
  CreateVariantDto,
  CreateStyleDto,
} from '../dto/create-product.dto.js';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(
    id: string,
    data: Partial<CreateProductData> & {
      variants?: CreateVariantDto[];
      styles?: CreateStyleDto[];
    },
  ) {
    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Producto no encontrado');
    }

    // 1. Actualizar datos base del producto
    const { variants, styles, ...productData } = data;
    await this.productRepository.update(id, productData);

    // 2. Si es single con variantes, reemplazar todas (delete + recreate)
    if (existing.productType === 'single' && variants !== undefined) {
      await this.productRepository.deleteAllVariantsByProduct(id);
      for (const variant of variants) {
        await this.productRepository.createVariantForProduct(id, {
          sizeLabel: variant.sizeLabel,
          color: variant.color,
          price: variant.price,
          stock: variant.stock,
          sku: variant.sku,
        });
      }
    }

    // 3. Si es multiple con estilos, reemplazar todos (delete estilos cascadea variantes)
    if (existing.productType === 'multiple' && styles !== undefined) {
      await this.productRepository.deleteAllStyles(id);
      for (let i = 0; i < styles.length; i++) {
        const styleDto = styles[i];
        const style = await this.productRepository.createStyle(id, {
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

    // 4. Retornar producto completo
    return this.productRepository.findById(id);
  }
}
