import { Test, TestingModule } from '@nestjs/testing';
import { GetSizeSystemsUseCase } from './get-size-systems.use-case';
import { PRODUCT_REPOSITORY } from '../domain/product.repository.interface';

describe('GetSizeSystemsUseCase — HUMP10 (Sistemas de Tallas)', () => {
  let useCase: GetSizeSystemsUseCase;

  const mockProductRepository = {
    getSizeSystems: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetSizeSystemsUseCase,
        { provide: PRODUCT_REPOSITORY, useValue: mockProductRepository },
      ],
    }).compile();

    useCase = module.get<GetSizeSystemsUseCase>(GetSizeSystemsUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(useCase).toBeDefined();
  });

  it('CA1 — debería llamar a getSizeSystems del repositorio y devolver la lista', async () => {
    const fakeSystems = [
      { id: 'sys-1', name: 'Zapatos Adulto', options: [] },
    ];
    mockProductRepository.getSizeSystems.mockResolvedValue(fakeSystems);

    const result = await useCase.execute();

    expect(mockProductRepository.getSizeSystems).toHaveBeenCalled();
    expect(result).toEqual(fakeSystems);
  });
});
