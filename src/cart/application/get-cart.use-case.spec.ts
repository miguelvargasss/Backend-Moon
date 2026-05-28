import { Test, TestingModule } from '@nestjs/testing';
import { GetCartUseCase } from './get-cart.use-case';
import { CART_REPOSITORY } from '../domain/cart.repository.interface';

describe('GetCartUseCase — HUMP02', () => {
  let useCase: GetCartUseCase;

  const mockCartRepository = {
    findByUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCartUseCase,
        { provide: CART_REPOSITORY, useValue: mockCartRepository },
      ],
    }).compile();

    useCase = module.get<GetCartUseCase>(GetCartUseCase);
  });

  it('CA2 — debería devolver los items del carrito', async () => {
    const fakeItems = [{ id: '1', quantity: 2 }];
    mockCartRepository.findByUserId.mockResolvedValue(fakeItems);

    const result = await useCase.execute('user-1');

    expect(mockCartRepository.findByUserId).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(fakeItems);
  });
});
