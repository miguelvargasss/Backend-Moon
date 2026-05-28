import { Test, TestingModule } from '@nestjs/testing';
import { DeleteShippingAddressUseCase } from './delete-shipping-address.use-case';
import { SHIPPING_REPOSITORY } from '../domain/shipping.repository.interface';

describe('DeleteShippingAddressUseCase — HUMP11', () => {
  let useCase: DeleteShippingAddressUseCase;

  const mockShippingRepository = {
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteShippingAddressUseCase,
        { provide: SHIPPING_REPOSITORY, useValue: mockShippingRepository },
      ],
    }).compile();

    useCase = module.get<DeleteShippingAddressUseCase>(DeleteShippingAddressUseCase);
  });

  it('CA3 — debería eliminar la dirección', async () => {
    mockShippingRepository.delete.mockResolvedValue(undefined);

    await useCase.execute('addr-1');

    expect(mockShippingRepository.delete).toHaveBeenCalledWith('addr-1');
  });
});
