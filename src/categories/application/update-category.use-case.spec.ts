import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpdateCategoryUseCase } from './update-category.use-case';
import { CATEGORY_REPOSITORY } from '../domain/category.repository.interface';

describe('UpdateCategoryUseCase — HUMP09 (Categorías)', () => {
  let useCase: UpdateCategoryUseCase;

  const mockCategoryRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCategoryUseCase,
        { provide: CATEGORY_REPOSITORY, useValue: mockCategoryRepository },
      ],
    }).compile();

    useCase = module.get<UpdateCategoryUseCase>(UpdateCategoryUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(useCase).toBeDefined();
  });

  it('CA3 — debería actualizar si la categoría existe', async () => {
    const id = 'cat-1';
    const data = { name: 'Pantalones Ajustados' };
    
    mockCategoryRepository.findById.mockResolvedValue({ id, name: 'Pantalones' });
    mockCategoryRepository.update.mockResolvedValue({ id, ...data });

    const result = await useCase.execute(id, data);

    expect(mockCategoryRepository.findById).toHaveBeenCalledWith(id);
    expect(mockCategoryRepository.update).toHaveBeenCalledWith(id, data);
    expect(result).toEqual({ id, ...data });
  });

  it('CA3 — debería lanzar NotFoundException si no existe', async () => {
    mockCategoryRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('invalid-id', { name: 'test' })).rejects.toThrow(
      NotFoundException,
    );
    expect(mockCategoryRepository.update).not.toHaveBeenCalled();
  });
});
