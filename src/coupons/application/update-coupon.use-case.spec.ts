import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpdateCouponUseCase } from './update-coupon.use-case';
import { COUPON_REPOSITORY } from '../domain/coupon.repository.interface';

describe('UpdateCouponUseCase — HUMP05', () => {
  let useCase: UpdateCouponUseCase;

  const mockCouponRepository = {
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCouponUseCase,
        { provide: COUPON_REPOSITORY, useValue: mockCouponRepository },
      ],
    }).compile();

    useCase = module.get<UpdateCouponUseCase>(UpdateCouponUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('CA3 — debería actualizar y devolver el cupón', async () => {
    const id = 'c-1';
    const data = { couponQuantity: 10 };
    mockCouponRepository.update.mockResolvedValue({ id, ...data });

    const result = await useCase.execute(id, data);

    expect(mockCouponRepository.update).toHaveBeenCalledWith(id, data);
    expect(result).toEqual({ id, ...data });
  });

  it('debería lanzar NotFoundException si no existe', async () => {
    mockCouponRepository.update.mockResolvedValue(null);

    await expect(useCase.execute('inv', {})).rejects.toThrow(NotFoundException);
  });
});
