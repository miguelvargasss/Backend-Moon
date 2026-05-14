import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IProductRepository } from '../domain/product.repository.interface.js';
import { PRODUCT_REPOSITORY } from '../domain/product.repository.interface.js';

/**
 * CU04 — Eliminar/Desactivar producto.
 * Si el producto tiene historial de ventas (en order_item),
 * solo se desactiva (statusProduct → inactivo).
 * Si no tiene historial, se elimina de la BD.
 */
@Injectable()
export class DeleteProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(id: string): Promise<{ action: 'deleted' | 'deactivated' }> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    const hasHistory = await this.productRepository.hasOrderHistory(id);

    if (hasHistory) {
      // Soft-delete: buscar el statusProduct "inactivo" y asignarlo
      // Se pasa statusId con valor especial que el repo resolverá
      await this.productRepository.update(id, {
        statusId: '__INACTIVE__',
      } as any);
      return { action: 'deactivated' };
    }

    await this.productRepository.delete(id);
    return { action: 'deleted' };
  }
}
