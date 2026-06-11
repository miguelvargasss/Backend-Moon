import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpdateProductUseCase } from './update-product.use-case';
import { PRODUCT_REPOSITORY } from '../domain/product.repository.interface';

describe('UpdateProductUseCase — HUMP04 (Productos)', () => {
  let useCase: UpdateProductUseCase;

  const mockProductRepository = {
    findById: jest.fn(),
    update: jest.fn(),
    deleteAllVariantsByProduct: jest.fn(),
    createVariantForProduct: jest.fn(),
    deleteAllStyles: jest.fn(),
    createStyle: jest.fn(),
    createVariantForStyle: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateProductUseCase,
        { provide: PRODUCT_REPOSITORY, useValue: mockProductRepository },
      ],
    }).compile();

    useCase = module.get<UpdateProductUseCase>(UpdateProductUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería lanzar NotFoundException si el producto no existe', async () => {
    mockProductRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('invalid', {})).rejects.toThrow(
      NotFoundException,
    );
  });

  it('CA4 — debería actualizar datos base del producto', async () => {
    const id = 'prod-1';
    mockProductRepository.findById.mockResolvedValueOnce({
      id,
      productType: 'single',
    });
    mockProductRepository.findById.mockResolvedValueOnce({
      id,
      name: 'Updated Name',
      productType: 'single',
    });

    await useCase.execute(id, { name: 'Updated Name' });

    expect(mockProductRepository.update).toHaveBeenCalledWith(id, {
      name: 'Updated Name',
    });
  });

  it('CA4 — debería reemplazar variantes si es producto single', async () => {
    const id = 'prod-1';
    mockProductRepository.findById.mockResolvedValueOnce({
      id,
      productType: 'single',
    });

    const variants = [{ sizeLabel: 'M', price: 10, stock: 5, sku: 'sku1' }];
    await useCase.execute(id, { variants });

    expect(
      mockProductRepository.deleteAllVariantsByProduct,
    ).toHaveBeenCalledWith(id);
    expect(mockProductRepository.createVariantForProduct).toHaveBeenCalledWith(
      id,
      variants[0],
    );
  });

  it('CA4 — debería reemplazar estilos y variantes si es producto multiple', async () => {
    const id = 'prod-1';
    mockProductRepository.findById.mockResolvedValueOnce({
      id,
      productType: 'multiple',
    });
    mockProductRepository.createStyle.mockResolvedValue({ id: 'style-1' });

    const styles = [
      {
        name: 'Red',
        colorHex: '#f00',
        variants: [{ sizeLabel: 'M', price: 10, stock: 5, sku: 'sku1' }],
      },
    ];
    await useCase.execute(id, { styles });

    expect(mockProductRepository.deleteAllStyles).toHaveBeenCalledWith(id);
    expect(mockProductRepository.createStyle).toHaveBeenCalledWith(id, {
      name: 'Red',
      colorHex: '#f00',
      sortOrder: 0,
    });
    expect(mockProductRepository.createVariantForStyle).toHaveBeenCalledWith(
      'style-1',
      styles[0].variants[0],
    );
  });
});
