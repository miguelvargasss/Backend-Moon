import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeleteProductImageUseCase } from './delete-product-image.use-case';
import { PRODUCT_REPOSITORY } from '../domain/product.repository.interface';

describe('DeleteProductImageUseCase — HUMP04', () => {
  let useCase: DeleteProductImageUseCase;

  const mockProductRepository = {
    findById: jest.fn(),
    removeImage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteProductImageUseCase,
        { provide: PRODUCT_REPOSITORY, useValue: mockProductRepository },
      ],
    }).compile();

    useCase = module.get<DeleteProductImageUseCase>(DeleteProductImageUseCase);
  });

  it('debería lanzar NotFoundException si el producto no existe', async () => {
    mockProductRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('inv', 'img-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('CA7 — debería eliminar la imagen', async () => {
    mockProductRepository.findById.mockResolvedValue({ id: 'prod-1' });
    mockProductRepository.removeImage.mockResolvedValue(undefined);

    await useCase.execute('prod-1', 'img-1');

    expect(mockProductRepository.removeImage).toHaveBeenCalledWith('img-1');
  });
});
