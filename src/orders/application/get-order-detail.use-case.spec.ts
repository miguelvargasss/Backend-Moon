import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { GetOrderDetailUseCase } from './get-order-detail.use-case';
import { ORDER_REPOSITORY } from '../domain/order.repository.interface';

describe('GetOrderDetailUseCase — HUMP07', () => {
  let useCase: GetOrderDetailUseCase;

  const mockOrderRepository = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetOrderDetailUseCase,
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepository },
      ],
    }).compile();

    useCase = module.get<GetOrderDetailUseCase>(GetOrderDetailUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería lanzar NotFoundException si no existe', async () => {
    mockOrderRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('inv', 'u-1', false)).rejects.toThrow(NotFoundException);
  });

  it('debería lanzar ForbiddenException si no es dueño ni admin', async () => {
    mockOrderRepository.findById.mockResolvedValue({ id: 'ord-1', userId: 'other-user' });

    await expect(useCase.execute('ord-1', 'u-1', false)).rejects.toThrow(ForbiddenException);
  });

  it('CA2 — debería devolver detalle si es el dueño', async () => {
    const order = { id: 'ord-1', userId: 'u-1' };
    mockOrderRepository.findById.mockResolvedValue(order);

    const result = await useCase.execute('ord-1', 'u-1', false);
    expect(result).toEqual(order);
  });

  it('CA2 — debería devolver detalle si es admin, aunque no sea dueño', async () => {
    const order = { id: 'ord-1', userId: 'other-user' };
    mockOrderRepository.findById.mockResolvedValue(order);

    const result = await useCase.execute('ord-1', 'u-1', true);
    expect(result).toEqual(order);
  });
});
