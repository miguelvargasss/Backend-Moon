import { Test, TestingModule } from '@nestjs/testing';
import { GetProductStatusesUseCase } from './get-product-statuses.use-case';
import { PRODUCT_REPOSITORY } from '../domain/product.repository.interface';

describe('GetProductStatusesUseCase', () => {
  let useCase: GetProductStatusesUseCase;

  const mockProductRepository = {
    getStatuses: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProductStatusesUseCase,
        { provide: PRODUCT_REPOSITORY, useValue: mockProductRepository },
      ],
    }).compile();

    useCase = module.get<GetProductStatusesUseCase>(GetProductStatusesUseCase);
  });

  it('debería devolver los estados', async () => {
    const fakeStatuses = [{ id: '1', name: 'Activo' }];
    mockProductRepository.getStatuses.mockResolvedValue(fakeStatuses);

    const result = await useCase.execute();

    expect(mockProductRepository.getStatuses).toHaveBeenCalled();
    expect(result).toEqual(fakeStatuses);
  });
});
