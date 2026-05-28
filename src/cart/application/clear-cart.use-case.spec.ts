import { Test, TestingModule } from '@nestjs/testing';
import { ClearCartUseCase } from './clear-cart.use-case';
import { CART_REPOSITORY } from '../domain/cart.repository.interface';

describe('ClearCartUseCase — HUMP02', () => {
  let useCase: ClearCartUseCase;

  const mockCartRepository = {
    clearCart: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClearCartUseCase,
        { provide: CART_REPOSITORY, useValue: mockCartRepository },
      ],
    }).compile();

    useCase = module.get<ClearCartUseCase>(ClearCartUseCase);
  });

  it('CA5 — debería vaciar el carrito del usuario', async () => {
    mockCartRepository.clearCart.mockResolvedValue(undefined);

    await useCase.execute('user-1');

    expect(mockCartRepository.clearCart).toHaveBeenCalledWith('user-1');
  });
});
