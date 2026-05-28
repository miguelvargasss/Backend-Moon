import { Test, TestingModule } from '@nestjs/testing';
import { ListStatusesUseCase } from './list-statuses.use-case';
import { ORDER_REPOSITORY } from '../domain/order.repository.interface';

describe('ListStatusesUseCase', () => {
  let useCase: ListStatusesUseCase;

  const mockOrderRepository = {
    findAllStatuses: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListStatusesUseCase,
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepository },
      ],
    }).compile();

    useCase = module.get<ListStatusesUseCase>(ListStatusesUseCase);
  });

  it('debería devolver la lista de estados', async () => {
    const fakeStatuses = [{ id: '1', name: 'EN PROCESO' }];
    mockOrderRepository.findAllStatuses.mockResolvedValue(fakeStatuses);

    const result = await useCase.execute();

    expect(mockOrderRepository.findAllStatuses).toHaveBeenCalled();
    expect(result).toEqual(fakeStatuses);
  });
});
