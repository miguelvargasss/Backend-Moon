import { Test, TestingModule } from '@nestjs/testing';
import { UpdateCartItemUseCase } from './update-cart-item.use-case';
import { CART_REPOSITORY } from '../domain/cart.repository.interface';

describe('UpdateCartItemUseCase — HUMP02', () => {
  let useCase: UpdateCartItemUseCase;

  const mockCartRepository = {
    updateQuantity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCartItemUseCase,
        { provide: CART_REPOSITORY, useValue: mockCartRepository },
      ],
    }).compile();

    useCase = module.get<UpdateCartItemUseCase>(UpdateCartItemUseCase);
  });

  it('CA3 — debería actualizar la cantidad', async () => {
    mockCartRepository.updateQuantity.mockResolvedValue({ id: 'item-1', quantity: 5 });

    const result = await useCase.execute('item-1', 5);

    expect(mockCartRepository.updateQuantity).toHaveBeenCalledWith('item-1', 5);
    expect(result).toEqual({ id: 'item-1', quantity: 5 });
  });
});
