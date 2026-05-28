import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { CreateCouponUseCase } from './create-coupon.use-case';
import { COUPON_REPOSITORY } from '../domain/coupon.repository.interface';

const FUTURE_DATE = new Date(Date.now() + 86400000 * 30);

const couponData = {
  code: 'LUNA10',
  expirationDate: FUTURE_DATE,
  couponQuantity: 50,
  minimumAmount: 100,
  discountAmount: 10,
  discountType: 'fixed' as const,
  categoryId: undefined,
};

describe('CreateCouponUseCase — HUMP05 (Gestión de Cupones)', () => {
  let useCase: CreateCouponUseCase;

  const mockCouponRepository = {
    findByCode: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCouponUseCase,
        { provide: COUPON_REPOSITORY, useValue: mockCouponRepository },
      ],
    }).compile();

    useCase = module.get<CreateCouponUseCase>(CreateCouponUseCase);
  });

  afterEach(() => jest.clearAllMocks());

  it('debería estar definido', () => {
    expect(useCase).toBeDefined();
  });

  it('CA1+CA4 — debería crear un cupón con código alfanumérico y registrarlo', async () => {
    mockCouponRepository.findByCode.mockResolvedValue(null);
    mockCouponRepository.create.mockResolvedValue({ id: 'c-1', ...couponData });

    const result = await useCase.execute(couponData);

    expect(mockCouponRepository.findByCode).toHaveBeenCalledWith('LUNA10');
    expect(mockCouponRepository.create).toHaveBeenCalledWith(couponData);
    expect(result).toMatchObject({ code: 'LUNA10' });
  });

  it('CA2 — debería aceptar tipo de descuento fijo', async () => {
    mockCouponRepository.findByCode.mockResolvedValue(null);
    mockCouponRepository.create.mockResolvedValue({ id: 'c-1', ...couponData });

    await useCase.execute({ ...couponData, discountType: 'fixed' });

    expect(mockCouponRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ discountType: 'fixed' }),
    );
  });

  it('CA2 — debería aceptar tipo de descuento porcentual', async () => {
    const percentageCoupon = {
      ...couponData,
      discountType: 'percentage' as const,
      discountAmount: 15,
    };
    mockCouponRepository.findByCode.mockResolvedValue(null);
    mockCouponRepository.create.mockResolvedValue({
      id: 'c-2',
      ...percentageCoupon,
    });

    await useCase.execute(percentageCoupon);

    expect(mockCouponRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ discountType: 'percentage' }),
    );
  });

  it('CA3 — debería crear cupón con restricciones (monto mínimo, categoría, fecha, cantidad)', async () => {
    const restricted = {
      ...couponData,
      minimumAmount: 200,
      categoryId: 'cat-poleras',
      couponQuantity: 10,
      expirationDate: FUTURE_DATE,
    };
    mockCouponRepository.findByCode.mockResolvedValue(null);
    mockCouponRepository.create.mockResolvedValue({ id: 'c-3', ...restricted });

    await useCase.execute(restricted);

    expect(mockCouponRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        minimumAmount: 200,
        categoryId: 'cat-poleras',
        couponQuantity: 10,
      }),
    );
  });

  it('debería lanzar ConflictException si el código de cupón ya existe', async () => {
    mockCouponRepository.findByCode.mockResolvedValue({
      id: 'existing',
      code: 'LUNA10',
    });

    await expect(useCase.execute(couponData)).rejects.toThrow(
      ConflictException,
    );
    await expect(useCase.execute(couponData)).rejects.toThrow(
      'El código de cupón ya existe',
    );
    expect(mockCouponRepository.create).not.toHaveBeenCalled();
  });

  it('debería lanzar BadRequestException si la fecha de expiración es pasada', async () => {
    const PAST_DATE = new Date(Date.now() - 86400000 * 5); // Hace 5 días
    const pastCoupon = { ...couponData, expirationDate: PAST_DATE };

    await expect(useCase.execute(pastCoupon)).rejects.toThrow(
      require('@nestjs/common').BadRequestException,
    );
    await expect(useCase.execute(pastCoupon)).rejects.toThrow(
      'La fecha de expiración debe ser la fecha de hoy o una fecha futura.',
    );
    expect(mockCouponRepository.create).not.toHaveBeenCalled();
  });
});
