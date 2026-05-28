import { Test, TestingModule } from '@nestjs/testing';
import { ListProductsUseCase } from './list-products.use-case';
import { PRODUCT_REPOSITORY } from '../domain/product.repository.interface';

describe('ListProductsUseCase — HUMP04 (Productos)', () => {
  let useCase: ListProductsUseCase;

  const mockProductRepository = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListProductsUseCase,
        { provide: PRODUCT_REPOSITORY, useValue: mockProductRepository },
      ],
    }).compile();

    useCase = module.get<ListProductsUseCase>(ListProductsUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(useCase).toBeDefined();
  });

  it('CA1 — debería llamar a findAll y devolver la lista de productos', async () => {
    const fakeProducts = [{ id: '1', name: 'Product1' }];
    mockProductRepository.findAll.mockResolvedValue(fakeProducts);

    const result = await useCase.execute();

    expect(mockProductRepository.findAll).toHaveBeenCalledWith(undefined);
    expect(result).toEqual(fakeProducts);
  });

  it('CA1 — debería pasar los filtros a findAll', async () => {
    const filters = { categoryId: 'cat-1', statusId: 'stat-1' };
    mockProductRepository.findAll.mockResolvedValue([]);

    await useCase.execute(filters);

    expect(mockProductRepository.findAll).toHaveBeenCalledWith(filters);
  });
});
