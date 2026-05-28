import { Test, TestingModule } from '@nestjs/testing';
import { RemoveFromCartUseCase } from './remove-from-cart.use-case';
import { CART_REPOSITORY } from '../domain/cart.repository.interface';

describe('RemoveFromCartUseCase — HUMP02', () => {
  let useCase: RemoveFromCartUseCase;

  const mockCartRepository = {
    removeItem: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemoveFromCartUseCase,
        { provide: CART_REPOSITORY, useValue: mockCartRepository },
      ],
    }).compile();

    useCase = module.get<RemoveFromCartUseCase>(RemoveFromCartUseCase);
  });

  it('CA4 — debería eliminar item del carrito', async () => {
    mockCartRepository.removeItem.mockResolvedValue(undefined);

    await useCase.execute('item-1');

    expect(mockCartRepository.removeItem).toHaveBeenCalledWith('item-1');
  });
});
