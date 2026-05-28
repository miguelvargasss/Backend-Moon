import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CreateProductUseCase } from './create-product.use-case';
import { PRODUCT_REPOSITORY } from '../domain/product.repository.interface';

const mockProductBase = {
  id: 'prod-1',
  name: 'Polera Luna Nueva',
  productType: 'single',
  price: 80,
  totalStock: 10,
  categoryId: 'cat-1',
  variants: [],
  styles: [],
};

describe('CreateProductUseCase — HUMP04 (Gestión de Inventario)', () => {
  let useCase: CreateProductUseCase;

  const mockProductRepository = {
    create: jest.fn(),
    createVariantForProduct: jest.fn(),
    createStyle: jest.fn(),
    createVariantForStyle: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateProductUseCase,
        { provide: PRODUCT_REPOSITORY, useValue: mockProductRepository },
      ],
    }).compile();

    useCase = module.get<CreateProductUseCase>(CreateProductUseCase);
  });

  afterEach(() => jest.clearAllMocks());

  it('debería estar definido', () => {
    expect(useCase).toBeDefined();
  });

  it('CA1+CA2 — debería crear un producto único con categoría asignada', async () => {
    mockProductRepository.create.mockResolvedValue(mockProductBase);
    mockProductRepository.findById.mockResolvedValue(mockProductBase);

    const result = await useCase.execute({
      name: 'Polera Luna Nueva',
      productType: 'single',
      price: 80,
      stock: 10,
      categoryId: 'cat-1',
      statusId: 'status-active',
    });

    expect(mockProductRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Polera Luna Nueva',
        categoryId: 'cat-1',
      }),
    );
    expect(result).toEqual(mockProductBase);
  });

  it('CA4 — debería guardar los cambios (llamar al repositorio)', async () => {
    mockProductRepository.create.mockResolvedValue(mockProductBase);
    mockProductRepository.findById.mockResolvedValue(mockProductBase);

    await useCase.execute({
      name: 'Polera Test',
      productType: 'single',
      price: 50,
      statusId: 'status-1',
    });

    expect(mockProductRepository.create).toHaveBeenCalledTimes(1);
    expect(mockProductRepository.findById).toHaveBeenCalledWith('prod-1');
  });

  it('debería lanzar BadRequestException si el producto único no tiene precio', async () => {
    await expect(
      useCase.execute({
        name: 'Test',
        productType: 'single',
        statusId: 'st-1',
      }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      useCase.execute({
        name: 'Test',
        productType: 'single',
        statusId: 'st-1',
      }),
    ).rejects.toThrow('El precio es obligatorio para un producto único');
  });

  it('debería lanzar BadRequestException si el producto múltiple no tiene estilos', async () => {
    await expect(
      useCase.execute({
        name: 'Test',
        productType: 'multiple',
        statusId: 'st-1',
        styles: [],
      }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      useCase.execute({
        name: 'Test',
        productType: 'multiple',
        statusId: 'st-1',
        styles: [],
      }),
    ).rejects.toThrow('Se requiere al menos un estilo');
  });

  it('debería crear variantes para un producto único con tallas', async () => {
    mockProductRepository.create.mockResolvedValue(mockProductBase);
    mockProductRepository.createVariantForProduct.mockResolvedValue({
      id: 'var-1',
    });
    mockProductRepository.findById.mockResolvedValue(mockProductBase);

    await useCase.execute({
      name: 'Polera Tallas',
      productType: 'single',
      price: 70,
      statusId: 'st-1',
      variants: [
        { sizeLabel: 'S', stock: 5, price: 70 },
        { sizeLabel: 'M', stock: 10, price: 70 },
      ],
    });

    expect(mockProductRepository.createVariantForProduct).toHaveBeenCalledTimes(
      2,
    );
  });

  it('CA2+CA3 — debería crear estilos y variantes para un producto múltiple', async () => {
    mockProductRepository.create.mockResolvedValue({
      ...mockProductBase,
      productType: 'multiple',
    });
    mockProductRepository.createStyle.mockResolvedValue({ id: 'style-1' });
    mockProductRepository.createVariantForStyle.mockResolvedValue({
      id: 'var-1',
    });
    mockProductRepository.findById.mockResolvedValue({
      ...mockProductBase,
      productType: 'multiple',
    });

    await useCase.execute({
      name: 'Polera Colores',
      productType: 'multiple',
      statusId: 'st-1',
      styles: [
        {
          name: 'Negro',
          colorHex: '#000',
          variants: [{ sizeLabel: 'M', stock: 5, price: 85 }],
        },
      ],
    });

    expect(mockProductRepository.createStyle).toHaveBeenCalledWith(
      'prod-1',
      expect.objectContaining({ name: 'Negro' }),
    );
    expect(mockProductRepository.createVariantForStyle).toHaveBeenCalledWith(
      'style-1',
      expect.objectContaining({ sizeLabel: 'M' }),
    );
  });
});
