import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UpdateOrderStatusUseCase } from './update-order-status.use-case';
import { ORDER_REPOSITORY } from '../domain/order.repository.interface';
import { USER_REPOSITORY } from '../../users/domain/user.repository.interface';

const makeOrder = (
  overrides: {
    statusName?: string;
    pointsAwarded?: boolean;
    userId?: string;
  } = {},
) => ({
  id: 'order-1',
  orderCode: 'ABC1234',
  userId: overrides.userId ?? 'user-1',
  date: new Date(),
  statusName: overrides.statusName ?? 'EN PROCESO',
  pointsAwarded: overrides.pointsAwarded ?? false,
});

const mockOrderItems = [
  {
    id: 'item-1',
    orderId: 'order-1',
    productId: 'prod-1',
    quantity: 2,
    priceAtSale: 50,
  },
];

describe('UpdateOrderStatusUseCase — HUMP08 (Gestión de Pedidos y MoonPoints)', () => {
  let useCase: UpdateOrderStatusUseCase;

  const mockOrderRepository = {
    findById: jest.fn(),
    getStatusIdByName: jest.fn(),
    updateStatus: jest.fn(),
    addHistory: jest.fn(),
    findItemsByOrderId: jest.fn(),
    markPointsAwarded: jest.fn(),
  };

  const mockUserRepository = {
    addPoints: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateOrderStatusUseCase,
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepository },
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
      ],
    }).compile();

    useCase = module.get<UpdateOrderStatusUseCase>(UpdateOrderStatusUseCase);
  });

  afterEach(() => jest.clearAllMocks());

  it('debería estar definido', () => {
    expect(useCase).toBeDefined();
  });

  it('CA3 — debería lanzar NotFoundException si el pedido no existe', async () => {
    mockOrderRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('order-x', 'CONFIRMADO')).rejects.toThrow(
      NotFoundException,
    );
    await expect(useCase.execute('order-x', 'CONFIRMADO')).rejects.toThrow(
      'Pedido no encontrado',
    );
  });

  it('CA4 — debería lanzar BadRequestException si el estado nuevo no existe en BD', async () => {
    mockOrderRepository.findById.mockResolvedValue(makeOrder());
    mockOrderRepository.getStatusIdByName.mockResolvedValue(null);

    await expect(useCase.execute('order-1', 'ESTADO_FALSO')).rejects.toThrow(
      BadRequestException,
    );
    await expect(useCase.execute('order-1', 'ESTADO_FALSO')).rejects.toThrow(
      'no encontrado',
    );
  });

  it('debería lanzar BadRequestException si el pedido ya está FINALIZADO', async () => {
    mockOrderRepository.findById.mockResolvedValue(
      makeOrder({ statusName: 'FINALIZADO' }),
    );

    await expect(useCase.execute('order-1', 'ENVIADO')).rejects.toThrow(
      BadRequestException,
    );
    await expect(useCase.execute('order-1', 'ENVIADO')).rejects.toThrow(
      '"FINALIZADO"',
    );
  });

  it('debería lanzar BadRequestException si el pedido ya está CANCELADO', async () => {
    mockOrderRepository.findById.mockResolvedValue(
      makeOrder({ statusName: 'CANCELADO' }),
    );

    await expect(useCase.execute('order-1', 'ENVIADO')).rejects.toThrow(
      BadRequestException,
    );
    await expect(useCase.execute('order-1', 'ENVIADO')).rejects.toThrow(
      '"CANCELADO"',
    );
  });

  it('CA5 — debería actualizar el estado y registrar en el historial', async () => {
    mockOrderRepository.findById.mockResolvedValue(makeOrder());
    mockOrderRepository.getStatusIdByName.mockResolvedValue('status-enviado');
    mockOrderRepository.updateStatus.mockResolvedValue(undefined);
    mockOrderRepository.addHistory.mockResolvedValue(undefined);

    const result = await useCase.execute('order-1', 'ENVIADO');

    expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith(
      'order-1',
      'status-enviado',
    );
    expect(mockOrderRepository.addHistory).toHaveBeenCalledWith('order-1');
    expect(result.previousStatus).toBe('EN PROCESO');
    expect(result.newStatus).toBe('ENVIADO');
  });

  it('CA6 — debería otorgar MoonPoints al cambiar a CONFIRMADO (1 pt por S/2 gastados)', async () => {
    // 2 items * S/50 = S/100 → 100/2 = 50 puntos
    mockOrderRepository.findById.mockResolvedValue(
      makeOrder({ statusName: 'EN PROCESO', pointsAwarded: false }),
    );
    mockOrderRepository.getStatusIdByName.mockResolvedValue(
      'status-confirmado',
    );
    mockOrderRepository.updateStatus.mockResolvedValue(undefined);
    mockOrderRepository.addHistory.mockResolvedValue(undefined);
    mockOrderRepository.findItemsByOrderId.mockResolvedValue(mockOrderItems);
    mockOrderRepository.markPointsAwarded.mockResolvedValue(undefined);
    mockUserRepository.addPoints.mockResolvedValue(50);

    const result = await useCase.execute('order-1', 'CONFIRMADO');

    expect(mockUserRepository.addPoints).toHaveBeenCalledWith('user-1', 50);
    expect(mockOrderRepository.markPointsAwarded).toHaveBeenCalledWith(
      'order-1',
    );
    expect(result.pointsAwarded).toBe(50);
  });

  it('CA6 — no debe otorgar MoonPoints si ya fueron acreditados (idempotencia)', async () => {
    mockOrderRepository.findById.mockResolvedValue(
      makeOrder({ pointsAwarded: true }),
    );
    mockOrderRepository.getStatusIdByName.mockResolvedValue(
      'status-confirmado',
    );
    mockOrderRepository.updateStatus.mockResolvedValue(undefined);
    mockOrderRepository.addHistory.mockResolvedValue(undefined);

    const result = await useCase.execute('order-1', 'CONFIRMADO');

    expect(mockUserRepository.addPoints).not.toHaveBeenCalled();
    expect(result.pointsAwarded).toBe(0);
  });

  it('CA6 — no debe otorgar MoonPoints para estados distintos a CONFIRMADO', async () => {
    mockOrderRepository.findById.mockResolvedValue(makeOrder());
    mockOrderRepository.getStatusIdByName.mockResolvedValue('status-enviado');
    mockOrderRepository.updateStatus.mockResolvedValue(undefined);
    mockOrderRepository.addHistory.mockResolvedValue(undefined);

    const result = await useCase.execute('order-1', 'ENVIADO');

    expect(mockUserRepository.addPoints).not.toHaveBeenCalled();
    expect(result.pointsAwarded).toBe(0);
  });
});
