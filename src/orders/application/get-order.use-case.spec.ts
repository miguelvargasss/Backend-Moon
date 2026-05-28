import { Test, TestingModule } from '@nestjs/testing';
import { GetOrderUseCase } from './get-order.use-case';
import { ORDER_REPOSITORY } from '../domain/order.repository.interface';

describe('GetOrderUseCase', () => {
  let useCase: GetOrderUseCase;

  const mockOrderRepository = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetOrderUseCase,
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepository },
      ],
    }).compile();

    useCase = module.get<GetOrderUseCase>(GetOrderUseCase);
  });

  it('debería devolver una orden por ID', async () => {
    const fakeOrder = { id: 'ord-1' };
    mockOrderRepository.findById.mockResolvedValue(fakeOrder);

    const result = await useCase.execute('ord-1');

    expect(mockOrderRepository.findById).toHaveBeenCalledWith('ord-1');
    expect(result).toEqual(fakeOrder);
  });
});
