import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ValidateCouponUseCase } from './validate-coupon.use-case';
import { COUPON_REPOSITORY } from '../domain/coupon.repository.interface';
import { CART_REPOSITORY } from '../../cart/domain/cart.repository.interface';
import { PRODUCT_REPOSITORY } from '../../products/domain/product.repository.interface';
import { Coupon } from '../domain/coupon.entity';

const FUTURE = new Date(Date.now() + 86400000 * 30);
const PAST = new Date(Date.now() - 86400000);

const makeCoupon = (
  overrides: Partial<{
    id: string;
    code: string;
    expirationDate: Date;
    couponQuantity: number;
    minimumAmount: number;
    discountAmount: number;
    discountType: 'fixed' | 'percentage';
    categoryId?: string;
  }> = {},
) => {
  const d = {
    id: 'c-1',
    code: 'LUNA10',
    expirationDate: FUTURE,
    couponQuantity: 5,
    minimumAmount: 50,
    discountAmount: 10,
    discountType: 'fixed' as const,
    categoryId: undefined,
    ...overrides,
  };
  return new Coupon(
    d.id,
    d.code,
    d.expirationDate,
    d.couponQuantity,
    d.minimumAmount,
    d.discountAmount,
    d.discountType,
    d.categoryId,
  );
};

const mockCartItem = {
  id: 'ci-1',
  productId: 'prod-1',
  quantity: 2,
  productPrice: 50,
};
const mockProduct = { id: 'prod-1', price: 50, categoryId: 'cat-1' };

describe('ValidateCouponUseCase — HUMP06 (Aplicación de Cupones)', () => {
  let useCase: ValidateCouponUseCase;

  const mockCouponRepository = { findByCode: jest.fn() };
  const mockCartRepository = { findByUserId: jest.fn() };
  const mockProductRepository = { findById: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateCouponUseCase,
        { provide: COUPON_REPOSITORY, useValue: mockCouponRepository },
        { provide: CART_REPOSITORY, useValue: mockCartRepository },
        { provide: PRODUCT_REPOSITORY, useValue: mockProductRepository },
      ],
    }).compile();

    useCase = module.get<ValidateCouponUseCase>(ValidateCouponUseCase);
  });

  afterEach(() => jest.clearAllMocks());

  it('debería estar definido', () => {
    expect(useCase).toBeDefined();
  });

  it('CA3 — debería lanzar BadRequestException si el código de cupón no existe', async () => {
    mockCouponRepository.findByCode.mockResolvedValue(null);

    await expect(useCase.execute('NO-EXISTE', 'user-1')).rejects.toThrow(
      BadRequestException,
    );
    await expect(useCase.execute('NO-EXISTE', 'user-1')).rejects.toThrow(
      'El codigo de Cupon no existe',
    );
  });

  it('CA4 — debería lanzar BadRequestException si el cupón está expirado', async () => {
    mockCouponRepository.findByCode.mockResolvedValue(
      makeCoupon({ expirationDate: PAST }),
    );

    await expect(useCase.execute('LUNA10', 'user-1')).rejects.toThrow(
      BadRequestException,
    );
    await expect(useCase.execute('LUNA10', 'user-1')).rejects.toThrow(
      'expirado',
    );
  });

  it('CA4 — debería lanzar BadRequestException si el cupón no tiene stock (agotado)', async () => {
    mockCouponRepository.findByCode.mockResolvedValue(
      makeCoupon({ couponQuantity: 0 }),
    );

    await expect(useCase.execute('LUNA10', 'user-1')).rejects.toThrow(
      BadRequestException,
    );
    await expect(useCase.execute('LUNA10', 'user-1')).rejects.toThrow(
      'usos disponibles',
    );
  });

  it('CA4 — debería lanzar BadRequestException si el carrito está vacío', async () => {
    mockCouponRepository.findByCode.mockResolvedValue(makeCoupon());
    mockCartRepository.findByUserId.mockResolvedValue([]);

    await expect(useCase.execute('LUNA10', 'user-1')).rejects.toThrow(
      BadRequestException,
    );
    await expect(useCase.execute('LUNA10', 'user-1')).rejects.toThrow(
      'carrito esta vacio',
    );
  });

  it('CA4 — debería lanzar BadRequestException si no supera el monto mínimo', async () => {
    // minimumAmount: 200, pero el carrito tiene 50 * 2 = 100
    mockCouponRepository.findByCode.mockResolvedValue(
      makeCoupon({ minimumAmount: 200 }),
    );
    mockCartRepository.findByUserId.mockResolvedValue([mockCartItem]);
    mockProductRepository.findById.mockResolvedValue(mockProduct);

    await expect(useCase.execute('LUNA10', 'user-1')).rejects.toThrow(
      BadRequestException,
    );
    await expect(useCase.execute('LUNA10', 'user-1')).rejects.toThrow(
      'monto mínimo',
    );
  });

  it('CA4 — debería lanzar BadRequestException si el cupón es de categoría pero el carrito no la contiene', async () => {
    mockCouponRepository.findByCode.mockResolvedValue(
      makeCoupon({ categoryId: 'cat-otra', minimumAmount: 0 }),
    );
    mockCartRepository.findByUserId.mockResolvedValue([mockCartItem]);
    mockProductRepository.findById.mockResolvedValue(mockProduct); // categoryId: 'cat-1'

    await expect(useCase.execute('LUNA10', 'user-1')).rejects.toThrow(
      BadRequestException,
    );
    await expect(useCase.execute('LUNA10', 'user-1')).rejects.toThrow(
      'no aplica',
    );
  });

  it('CA5 — debería retornar el descuento fijo calculado correctamente', async () => {
    // Carrito: 50 * 2 = 100, descuento fijo: 10
    mockCouponRepository.findByCode.mockResolvedValue(
      makeCoupon({ minimumAmount: 50, discountAmount: 10 }),
    );
    mockCartRepository.findByUserId.mockResolvedValue([mockCartItem]);
    mockProductRepository.findById.mockResolvedValue(mockProduct);

    const result = await useCase.execute('LUNA10', 'user-1');

    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(10);
    expect(result.originalTotal).toBe(100);
  });

  it('CA5 — debería retornar el descuento porcentual calculado correctamente', async () => {
    // Carrito: 50 * 2 = 100, descuento 20% = 20
    mockCouponRepository.findByCode.mockResolvedValue(
      makeCoupon({
        minimumAmount: 50,
        discountAmount: 20,
        discountType: 'percentage',
      }),
    );
    mockCartRepository.findByUserId.mockResolvedValue([mockCartItem]);
    mockProductRepository.findById.mockResolvedValue(mockProduct);

    const result = await useCase.execute('LUNA10', 'user-1');

    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(20);
  });

  it('CA5 — el descuento nunca debe superar el total del carrito', async () => {
    // Descuento fijo de 999, pero carrito solo vale 100
    mockCouponRepository.findByCode.mockResolvedValue(
      makeCoupon({
        minimumAmount: 50,
        discountAmount: 999,
        discountType: 'fixed',
      }),
    );
    mockCartRepository.findByUserId.mockResolvedValue([mockCartItem]);
    mockProductRepository.findById.mockResolvedValue(mockProduct);

    const result = await useCase.execute('LUNA10', 'user-1');

    expect(result.discountAmount).toBeLessThanOrEqual(result.originalTotal);
  });
});
