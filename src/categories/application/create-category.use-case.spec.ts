import { Test, TestingModule } from '@nestjs/testing';
import { CreateCategoryUseCase } from './create-category.use-case';
import { CATEGORY_REPOSITORY } from '../domain/category.repository.interface';

describe('CreateCategoryUseCase — HUMP09 (Categorías)', () => {
  let useCase: CreateCategoryUseCase;

  const mockCategoryRepository = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCategoryUseCase,
        { provide: CATEGORY_REPOSITORY, useValue: mockCategoryRepository },
      ],
    }).compile();

    useCase = module.get<CreateCategoryUseCase>(CreateCategoryUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(useCase).toBeDefined();
  });

  it('CA2 — debería llamar a create y devolver la nueva categoría', async () => {
    const data = { name: 'Zapatos', icon: 'shoe-icon' };
    const created = { id: '3', ...data };

    mockCategoryRepository.create.mockResolvedValue(created);

    const result = await useCase.execute(data);

    expect(mockCategoryRepository.create).toHaveBeenCalledWith(data);
    expect(result).toEqual(created);
  });
});
