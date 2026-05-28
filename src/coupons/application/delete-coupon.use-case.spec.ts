import { Test, TestingModule } from '@nestjs/testing';
import { DeleteCouponUseCase } from './delete-coupon.use-case';
import { COUPON_REPOSITORY } from '../domain/coupon.repository.interface';

describe('DeleteCouponUseCase — HUMP05', () => {
  let useCase: DeleteCouponUseCase;

  const mockCouponRepository = {
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteCouponUseCase,
        { provide: COUPON_REPOSITORY, useValue: mockCouponRepository },
      ],
    }).compile();

    useCase = module.get<DeleteCouponUseCase>(DeleteCouponUseCase);
  });

  it('CA4 — debería eliminar el cupón', async () => {
    mockCouponRepository.delete.mockResolvedValue(undefined);

    await useCase.execute('c-1');

    expect(mockCouponRepository.delete).toHaveBeenCalledWith('c-1');
  });
});
