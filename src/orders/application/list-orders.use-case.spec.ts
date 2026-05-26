import { Test, TestingModule } from '@nestjs/testing';
import { ListOrdersUseCase } from './list-orders.use-case';
import { ORDER_REPOSITORY } from '../domain/order.repository.interface';

const mockOrders = [
  {
    id: 'order-1',
    orderCode: 'ABC1234',
    userId: 'user-1',
    date: new Date('2026-05-13'),
    statusName: 'EN PROCESO',
    items: [{ id: 'item-1', productName: 'Polera', quantity: 1, priceAtSale: 50 }],
  },
  {
    id: 'order-2',
    orderCode: 'XYZ9876',
    userId: 'user-1',
    date: new Date('2026-05-20'),
    statusName: 'CONFIRMADO',
    items: [],
  },
];

describe('ListOrdersUseCase — HUMP07 (Historial de Pedidos)', () => {
  let useCase: ListOrdersUseCase;

  const mockOrderRepository = {
    findByUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListOrdersUseCase,
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepository },
      ],
    }).compile();

    useCase = module.get<ListOrdersUseCase>(ListOrdersUseCase);
  });

  afterEach(() => jest.clearAllMocks());

  it('debería estar definido', () => {
    expect(useCase).toBeDefined();
  });

  it('CA2 — debería consultar los pedidos filtrando por user_id', async () => {
    mockOrderRepository.findByUserId.mockResolvedValue(mockOrders);

    await useCase.execute('user-1');

    expect(mockOrderRepository.findByUserId).toHaveBeenCalledWith('user-1');
    expect(mockOrderRepository.findByUserId).toHaveBeenCalledTimes(1);
  });

  it('CA3 — debería retornar la lista con ID, fecha y estado de cada pedido', async () => {
    mockOrderRepository.findByUserId.mockResolvedValue(mockOrders);

    const result = await useCase.execute('user-1');

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: 'order-1',
      orderCode: 'ABC1234',
      statusName: 'EN PROCESO',
    });
    expect(result[1]).toMatchObject({
      id: 'order-2',
      statusName: 'CONFIRMADO',
    });
  });

  it('CA4 — debería retornar los ítems del detalle de cada pedido', async () => {
    mockOrderRepository.findByUserId.mockResolvedValue(mockOrders);

    const result = await useCase.execute('user-1');

    expect(result[0].items).toBeDefined();
    expect(result[0].items![0]).toMatchObject({ productName: 'Polera', quantity: 1 });
  });

  it('debería retornar un array vacío si el usuario no tiene pedidos', async () => {
    mockOrderRepository.findByUserId.mockResolvedValue([]);

    const result = await useCase.execute('user-sin-pedidos');

    expect(result).toEqual([]);
  });

  it('no debería mezclar pedidos de distintos usuarios', async () => {
    mockOrderRepository.findByUserId.mockImplementation((uid: string) =>
      Promise.resolve(mockOrders.filter((o) => o.userId === uid)),
    );

    const resultUser1 = await useCase.execute('user-1');
    const resultUser2 = await useCase.execute('user-2');

    expect(resultUser1).toHaveLength(2);
    expect(resultUser2).toHaveLength(0);
  });
});
