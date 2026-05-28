import { Test, TestingModule } from '@nestjs/testing';
import { ListCouponsUseCase } from './list-coupons.use-case';
import { COUPON_REPOSITORY } from '../domain/coupon.repository.interface';

describe('ListCouponsUseCase — HUMP05', () => {
  let useCase: ListCouponsUseCase;

  const mockCouponRepository = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListCouponsUseCase,
        { provide: COUPON_REPOSITORY, useValue: mockCouponRepository },
      ],
    }).compile();

    useCase = module.get<ListCouponsUseCase>(ListCouponsUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('CA2 — debería devolver la lista de cupones', async () => {
    const fakeCoupons = [{ id: '1', code: 'LUNA10' }];
    mockCouponRepository.findAll.mockResolvedValue(fakeCoupons);

    const result = await useCase.execute();

    expect(mockCouponRepository.findAll).toHaveBeenCalled();
    expect(result).toEqual(fakeCoupons);
  });
});
