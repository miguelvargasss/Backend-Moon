import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeleteProductUseCase } from './delete-product.use-case';
import { PRODUCT_REPOSITORY } from '../domain/product.repository.interface';

describe('DeleteProductUseCase — HUMP04 (Productos)', () => {
  let useCase: DeleteProductUseCase;

  const mockProductRepository = {
    findById: jest.fn(),
    hasOrderHistory: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteProductUseCase,
        { provide: PRODUCT_REPOSITORY, useValue: mockProductRepository },
      ],
    }).compile();

    useCase = module.get<DeleteProductUseCase>(DeleteProductUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería lanzar NotFoundException si el producto no existe', async () => {
    mockProductRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('invalid')).rejects.toThrow(NotFoundException);
  });

  it('CA5 — debería desactivar el producto si tiene historial', async () => {
    const id = 'prod-1';
    mockProductRepository.findById.mockResolvedValue({ id });
    mockProductRepository.hasOrderHistory.mockResolvedValue(true);

    const result = await useCase.execute(id);

    expect(mockProductRepository.update).toHaveBeenCalledWith(id, {
      statusId: '__INACTIVE__',
    });
    expect(result).toEqual({ action: 'deactivated' });
  });

  it('CA5 — debería eliminar el producto si no tiene historial', async () => {
    const id = 'prod-2';
    mockProductRepository.findById.mockResolvedValue({ id });
    mockProductRepository.hasOrderHistory.mockResolvedValue(false);

    const result = await useCase.execute(id);

    expect(mockProductRepository.delete).toHaveBeenCalledWith(id);
    expect(result).toEqual({ action: 'deleted' });
  });
});
