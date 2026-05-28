import { Test, TestingModule } from '@nestjs/testing';
import { GetProductUseCase } from './get-product.use-case';
import { PRODUCT_REPOSITORY } from '../domain/product.repository.interface';

describe('GetProductUseCase — HUMP04 (Productos)', () => {
  let useCase: GetProductUseCase;

  const mockProductRepository = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProductUseCase,
        { provide: PRODUCT_REPOSITORY, useValue: mockProductRepository },
      ],
    }).compile();

    useCase = module.get<GetProductUseCase>(GetProductUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(useCase).toBeDefined();
  });

  it('CA2 — debería llamar a findById y devolver el producto', async () => {
    const id = 'prod-1';
    const fakeProduct = { id, name: 'Product1' };
    mockProductRepository.findById.mockResolvedValue(fakeProduct);

    const result = await useCase.execute(id);

    expect(mockProductRepository.findById).toHaveBeenCalledWith(id);
    expect(result).toEqual(fakeProduct);
  });
});
