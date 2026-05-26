import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AddToCartUseCase } from './add-to-cart.use-case';
import { CART_REPOSITORY } from '../domain/cart.repository.interface';
import { PRODUCT_REPOSITORY } from '../../products/domain/product.repository.interface';

const mockProduct = {
  id: 'prod-1',
  name: 'Polera Luna',
  totalStock: 5,
  price: 50,
  productType: 'single',
  variants: [],
  styles: [],
  categoryId: 'cat-1',
};

describe('AddToCartUseCase — HUMP02 (Carrito de Compras)', () => {
  let useCase: AddToCartUseCase;

  const mockCartRepository = {
    findExistingItem: jest.fn(),
    addItem: jest.fn(),
    updateQuantity: jest.fn(),
  };

  const mockProductRepository = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddToCartUseCase,
        { provide: CART_REPOSITORY, useValue: mockCartRepository },
        { provide: PRODUCT_REPOSITORY, useValue: mockProductRepository },
      ],
    }).compile();

    useCase = module.get<AddToCartUseCase>(AddToCartUseCase);
  });

  afterEach(() => jest.clearAllMocks());

  it('debería estar definido', () => {
    expect(useCase).toBeDefined();
  });

  it('CA1 — debería lanzar NotFoundException si el producto no existe', async () => {
    mockProductRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('user-1', 'prod-x', 1)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute('user-1', 'prod-x', 1)).rejects.toThrow('Producto no encontrado');
  });

  it('CA2 — debería verificar disponibilidad: lanzar BadRequestException si no hay stock', async () => {
    mockProductRepository.findById.mockResolvedValue({ ...mockProduct, totalStock: 0 });
    mockCartRepository.findExistingItem.mockResolvedValue(null);

    await expect(useCase.execute('user-1', 'prod-1', 1)).rejects.toThrow(BadRequestException);
    await expect(useCase.execute('user-1', 'prod-1', 1)).rejects.toThrow('Producto sin stock disponible');
  });

  it('CA3 — debería registrar el ítem en el carrito asociado a user y product', async () => {
    mockProductRepository.findById.mockResolvedValue(mockProduct);
    mockCartRepository.findExistingItem.mockResolvedValue(null);
    mockCartRepository.addItem.mockResolvedValue({ id: 'ci-1', quantity: 2 });

    const result = await useCase.execute('user-1', 'prod-1', 2);

    expect(mockCartRepository.addItem).toHaveBeenCalledWith('user-1', 'prod-1', 2, null);
    expect(result).toEqual({ id: 'ci-1', quantity: 2 });
  });

  it('CA3 — debería hacer merge de cantidad si el producto ya está en el carrito', async () => {
    mockProductRepository.findById.mockResolvedValue(mockProduct); // stock: 5
    mockCartRepository.findExistingItem.mockResolvedValue({ id: 'ci-1', quantity: 2 });
    mockCartRepository.updateQuantity.mockResolvedValue({ id: 'ci-1', quantity: 4 });

    const result = await useCase.execute('user-1', 'prod-1', 2);

    expect(mockCartRepository.updateQuantity).toHaveBeenCalledWith('ci-1', 4);
    expect(result).toEqual({ id: 'ci-1', quantity: 4 });
  });

  it('debería lanzar BadRequestException si el merge supera el stock disponible', async () => {
    mockProductRepository.findById.mockResolvedValue(mockProduct); // stock: 5
    mockCartRepository.findExistingItem.mockResolvedValue({ id: 'ci-1', quantity: 4 });

    await expect(useCase.execute('user-1', 'prod-1', 3)).rejects.toThrow(BadRequestException);
  });

  it('debería lanzar NotFoundException si la variante especificada no existe', async () => {
    mockProductRepository.findById.mockResolvedValue({
      ...mockProduct,
      productType: 'single',
      variants: [{ id: 'var-1', stock: 3 }],
    });
    mockCartRepository.findExistingItem.mockResolvedValue(null);

    await expect(useCase.execute('user-1', 'prod-1', 1, 'var-no-exist')).rejects.toThrow(NotFoundException);
    await expect(useCase.execute('user-1', 'prod-1', 1, 'var-no-exist')).rejects.toThrow('Variante no encontrada');
  });

  it('debería usar el stock de la variante cuando se especifica variantId', async () => {
    mockProductRepository.findById.mockResolvedValue({
      ...mockProduct,
      productType: 'single',
      variants: [{ id: 'var-1', stock: 3 }],
    });
    mockCartRepository.findExistingItem.mockResolvedValue(null);
    mockCartRepository.addItem.mockResolvedValue({ id: 'ci-1', quantity: 2 });

    await useCase.execute('user-1', 'prod-1', 2, 'var-1');

    expect(mockCartRepository.addItem).toHaveBeenCalledWith('user-1', 'prod-1', 2, 'var-1');
  });

  it('debería lanzar BadRequestException si la cantidad supera el stock de la variante', async () => {
    mockProductRepository.findById.mockResolvedValue({
      ...mockProduct,
      productType: 'single',
      variants: [{ id: 'var-1', stock: 1 }],
    });
    mockCartRepository.findExistingItem.mockResolvedValue(null);

    await expect(useCase.execute('user-1', 'prod-1', 5, 'var-1')).rejects.toThrow(BadRequestException);
  });
});
