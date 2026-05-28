import { Test, TestingModule } from '@nestjs/testing';
import { ListAllOrdersUseCase } from './list-all-orders.use-case';
import { ORDER_REPOSITORY } from '../domain/order.repository.interface';

describe('ListAllOrdersUseCase — HUMP08', () => {
  let useCase: ListAllOrdersUseCase;

  const mockOrderRepository = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListAllOrdersUseCase,
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepository },
      ],
    }).compile();

    useCase = module.get<ListAllOrdersUseCase>(ListAllOrdersUseCase);
  });

  it('CA1 — debería devolver todos los pedidos', async () => {
    const fakeOrders = [{ id: '1', status: 'EN PROCESO' }];
    mockOrderRepository.findAll.mockResolvedValue(fakeOrders);

    const result = await useCase.execute();

    expect(mockOrderRepository.findAll).toHaveBeenCalled();
    expect(result).toEqual(fakeOrders);
  });
});
