import { Test, TestingModule } from '@nestjs/testing';
import { ListCategoriesUseCase } from './list-categories.use-case';
import { CATEGORY_REPOSITORY } from '../domain/category.repository.interface';

describe('ListCategoriesUseCase — HUMP09 (Categorías)', () => {
  let useCase: ListCategoriesUseCase;

  const mockCategoryRepository = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListCategoriesUseCase,
        { provide: CATEGORY_REPOSITORY, useValue: mockCategoryRepository },
      ],
    }).compile();

    useCase = module.get<ListCategoriesUseCase>(ListCategoriesUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(useCase).toBeDefined();
  });

  it('CA1 — debería llamar a findAll y devolver todas las categorías', async () => {
    const fakeCategories = [
      { id: '1', name: 'Poleras' },
      { id: '2', name: 'Pantalones' },
    ];
    mockCategoryRepository.findAll.mockResolvedValue(fakeCategories);

    const result = await useCase.execute();

    expect(mockCategoryRepository.findAll).toHaveBeenCalled();
    expect(result).toEqual(fakeCategories);
  });
});
