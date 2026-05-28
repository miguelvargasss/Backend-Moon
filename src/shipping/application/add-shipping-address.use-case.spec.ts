import { Test, TestingModule } from '@nestjs/testing';
import { AddShippingAddressUseCase } from './add-shipping-address.use-case';
import { SHIPPING_REPOSITORY } from '../domain/shipping.repository.interface';

describe('AddShippingAddressUseCase — HUMP11', () => {
  let useCase: AddShippingAddressUseCase;

  const mockShippingRepository = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddShippingAddressUseCase,
        { provide: SHIPPING_REPOSITORY, useValue: mockShippingRepository },
      ],
    }).compile();

    useCase = module.get<AddShippingAddressUseCase>(AddShippingAddressUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('CA2 — debería guardar una dirección de envío', async () => {
    const data = { userId: 'u-1', address: 'Avenida 1' } as any;
    mockShippingRepository.create.mockResolvedValue({ id: 'addr-1', ...data });

    const result = await useCase.execute(data);

    expect(mockShippingRepository.create).toHaveBeenCalledWith(data);
    expect(result).toEqual({ id: 'addr-1', ...data });
  });
});
