import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateOrderUseCase } from './create-order.use-case';
import { ORDER_REPOSITORY } from '../domain/order.repository.interface';
import { CART_REPOSITORY } from '../../cart/domain/cart.repository.interface';
import { PRODUCT_REPOSITORY } from '../../products/domain/product.repository.interface';
import { SHIPPING_REPOSITORY } from '../../shipping/domain/shipping.repository.interface';
import { COUPON_REPOSITORY } from '../../coupons/domain/coupon.repository.interface';
import { ValidateCouponUseCase } from '../../coupons/application/validate-coupon.use-case';

const mockCartItem = {
  id: 'ci-1',
  productId: 'prod-1',
  quantity: 2,
  variantId: null,
  productPrice: null,
};

const mockProduct = {
  id: 'prod-1',
  name: 'Polera Luna',
  totalStock: 10,
  price: 50,
  productType: 'single',
  variants: [],
  styles: [],
  categoryId: 'cat-1',
};

const mockAddress = {
  id: 'addr-1',
  firstName: 'Juan',
  lastName: 'Pérez',
  address: 'Jr. Luna 123',
  city: 'Lima',
  phone: '999000111',
};

const mockOrder = { id: 'order-1', orderCode: 'ABC1234' };

describe('CreateOrderUseCase — HUMP03 (Procesamiento de Ventas)', () => {
  let useCase: CreateOrderUseCase;

  const mockOrderRepository = {
    create: jest.fn(),
    existsByOrderCode: jest.fn(),
    getStatusIdByName: jest.fn(),
  };
  const mockCartRepository = {
    findByUserId: jest.fn(),
    clearCart: jest.fn(),
  };
  const mockProductRepository = {
    findById: jest.fn(),
    decrementProductStock: jest.fn(),
    decrementVariantStock: jest.fn(),
  };
  const mockShippingRepository = { findById: jest.fn() };
  const mockCouponRepository = { decrementQuantity: jest.fn() };
  const mockValidateCouponUseCase = { execute: jest.fn() };
  const mockConfigService = { get: jest.fn().mockReturnValue('+51999159716') };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOrderUseCase,
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepository },
        { provide: CART_REPOSITORY, useValue: mockCartRepository },
        { provide: PRODUCT_REPOSITORY, useValue: mockProductRepository },
        { provide: SHIPPING_REPOSITORY, useValue: mockShippingRepository },
        { provide: COUPON_REPOSITORY, useValue: mockCouponRepository },
        { provide: ValidateCouponUseCase, useValue: mockValidateCouponUseCase },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    useCase = module.get<CreateOrderUseCase>(CreateOrderUseCase);
  });

  afterEach(() => jest.clearAllMocks());

  it('debería estar definido', () => {
    expect(useCase).toBeDefined();
  });

  it('CA1 — debería lanzar BadRequestException si el carrito está vacío', async () => {
    mockCartRepository.findByUserId.mockResolvedValue([]);

    await expect(useCase.execute('user-1', 'addr-1')).rejects.toThrow(
      BadRequestException,
    );
    await expect(useCase.execute('user-1', 'addr-1')).rejects.toThrow(
      'Tu carrito está vacío',
    );
  });

  it('debería lanzar NotFoundException si el producto del carrito no existe', async () => {
    mockCartRepository.findByUserId.mockResolvedValue([mockCartItem]);
    mockProductRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('user-1', 'addr-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('debería lanzar BadRequestException si no hay stock suficiente', async () => {
    mockCartRepository.findByUserId.mockResolvedValue([
      { ...mockCartItem, quantity: 20 },
    ]);
    mockProductRepository.findById.mockResolvedValue({
      ...mockProduct,
      totalStock: 5,
    });

    await expect(useCase.execute('user-1', 'addr-1')).rejects.toThrow(
      BadRequestException,
    );
    await expect(useCase.execute('user-1', 'addr-1')).rejects.toThrow(
      'Stock insuficiente',
    );
  });

  it('CA4 — debería lanzar NotFoundException si la dirección de envío no existe', async () => {
    mockCartRepository.findByUserId.mockResolvedValue([mockCartItem]);
    mockProductRepository.findById.mockResolvedValue(mockProduct);
    mockOrderRepository.getStatusIdByName.mockResolvedValue('status-1');
    mockShippingRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('user-1', 'addr-no-exist')).rejects.toThrow(
      NotFoundException,
    );
    await expect(useCase.execute('user-1', 'addr-no-exist')).rejects.toThrow(
      'Dirección de envío no encontrada',
    );
  });

  it('CA5 — el código de orden generado debe ser alfanumérico de 7 caracteres', async () => {
    mockCartRepository.findByUserId.mockResolvedValue([mockCartItem]);
    mockProductRepository.findById.mockResolvedValue(mockProduct);
    mockShippingRepository.findById.mockResolvedValue(mockAddress);
    mockOrderRepository.getStatusIdByName.mockResolvedValue(
      'status-en-proceso',
    );
    mockOrderRepository.existsByOrderCode.mockResolvedValue(false);
    mockOrderRepository.create.mockImplementation((data: any) => ({
      id: 'order-1',
      orderCode: data.orderCode,
    }));
    mockProductRepository.decrementProductStock.mockResolvedValue(undefined);
    mockCartRepository.clearCart.mockResolvedValue(undefined);

    const result = await useCase.execute('user-1', 'addr-1');

    expect(result.order.orderCode).toMatch(/^[A-Z0-9]{7}$/);
  });

  it('CA6 — debería registrar la orden con estado "EN PROCESO"', async () => {
    mockCartRepository.findByUserId.mockResolvedValue([mockCartItem]);
    mockProductRepository.findById.mockResolvedValue(mockProduct);
    mockShippingRepository.findById.mockResolvedValue(mockAddress);
    mockOrderRepository.getStatusIdByName.mockResolvedValue(
      'status-en-proceso',
    );
    mockOrderRepository.existsByOrderCode.mockResolvedValue(false);
    mockOrderRepository.create.mockResolvedValue(mockOrder);
    mockProductRepository.decrementProductStock.mockResolvedValue(undefined);
    mockCartRepository.clearCart.mockResolvedValue(undefined);

    await useCase.execute('user-1', 'addr-1');

    expect(mockOrderRepository.getStatusIdByName).toHaveBeenCalledWith(
      'EN PROCESO',
    );
    expect(mockOrderRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        statusId: 'status-en-proceso',
        userId: 'user-1',
      }),
      expect.any(Array),
    );
  });

  it('CA7 — debería retornar una URL de WhatsApp con los datos del pedido', async () => {
    mockCartRepository.findByUserId.mockResolvedValue([mockCartItem]);
    mockProductRepository.findById.mockResolvedValue(mockProduct);
    mockShippingRepository.findById.mockResolvedValue(mockAddress);
    mockOrderRepository.getStatusIdByName.mockResolvedValue(
      'status-en-proceso',
    );
    mockOrderRepository.existsByOrderCode.mockResolvedValue(false);
    mockOrderRepository.create.mockResolvedValue(mockOrder);
    mockProductRepository.decrementProductStock.mockResolvedValue(undefined);
    mockCartRepository.clearCart.mockResolvedValue(undefined);

    const result = await useCase.execute('user-1', 'addr-1');

    expect(result.whatsappUrl).toContain('wa.me/');
    expect(result.whatsappUrl).toContain('MoonPhases');
  });

  it('debería reducir el stock del producto después de crear la orden', async () => {
    mockCartRepository.findByUserId.mockResolvedValue([mockCartItem]);
    mockProductRepository.findById.mockResolvedValue(mockProduct);
    mockShippingRepository.findById.mockResolvedValue(mockAddress);
    mockOrderRepository.getStatusIdByName.mockResolvedValue(
      'status-en-proceso',
    );
    mockOrderRepository.existsByOrderCode.mockResolvedValue(false);
    mockOrderRepository.create.mockResolvedValue(mockOrder);
    mockProductRepository.decrementProductStock.mockResolvedValue(undefined);
    mockCartRepository.clearCart.mockResolvedValue(undefined);

    await useCase.execute('user-1', 'addr-1');

    expect(mockProductRepository.decrementProductStock).toHaveBeenCalledWith(
      'prod-1',
      2,
    );
  });

  it('debería vaciar el carrito después de crear la orden', async () => {
    mockCartRepository.findByUserId.mockResolvedValue([mockCartItem]);
    mockProductRepository.findById.mockResolvedValue(mockProduct);
    mockShippingRepository.findById.mockResolvedValue(mockAddress);
    mockOrderRepository.getStatusIdByName.mockResolvedValue(
      'status-en-proceso',
    );
    mockOrderRepository.existsByOrderCode.mockResolvedValue(false);
    mockOrderRepository.create.mockResolvedValue(mockOrder);
    mockProductRepository.decrementProductStock.mockResolvedValue(undefined);
    mockCartRepository.clearCart.mockResolvedValue(undefined);

    await useCase.execute('user-1', 'addr-1');

    expect(mockCartRepository.clearCart).toHaveBeenCalledWith('user-1');
  });
});
