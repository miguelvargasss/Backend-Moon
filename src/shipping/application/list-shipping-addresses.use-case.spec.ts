import { Test, TestingModule } from '@nestjs/testing';
import { ListShippingAddressesUseCase } from './list-shipping-addresses.use-case';
import { SHIPPING_REPOSITORY } from '../domain/shipping.repository.interface';

describe('ListShippingAddressesUseCase — HUMP11', () => {
  let useCase: ListShippingAddressesUseCase;

  const mockShippingRepository = {
    findByUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListShippingAddressesUseCase,
        { provide: SHIPPING_REPOSITORY, useValue: mockShippingRepository },
      ],
    }).compile();

    useCase = module.get<ListShippingAddressesUseCase>(
      ListShippingAddressesUseCase,
    );
  });

  it('CA1 — debería devolver direcciones del usuario', async () => {
    const fakeAddrs = [{ id: '1', address: 'Av 1' }];
    mockShippingRepository.findByUserId.mockResolvedValue(fakeAddrs);

    const result = await useCase.execute('u-1');

    expect(mockShippingRepository.findByUserId).toHaveBeenCalledWith('u-1');
    expect(result).toEqual(fakeAddrs);
  });
});
