import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeleteCategoryUseCase } from './delete-category.use-case';
import { CATEGORY_REPOSITORY } from '../domain/category.repository.interface';

describe('DeleteCategoryUseCase — HUMP09 (Categorías)', () => {
  let useCase: DeleteCategoryUseCase;

  const mockCategoryRepository = {
    findById: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteCategoryUseCase,
        { provide: CATEGORY_REPOSITORY, useValue: mockCategoryRepository },
      ],
    }).compile();

    useCase = module.get<DeleteCategoryUseCase>(DeleteCategoryUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(useCase).toBeDefined();
  });

  it('CA4 — debería eliminar si la categoría existe', async () => {
    const id = 'cat-1';
    
    mockCategoryRepository.findById.mockResolvedValue({ id, name: 'Poleras' });
    mockCategoryRepository.delete.mockResolvedValue(undefined);

    await useCase.execute(id);

    expect(mockCategoryRepository.findById).toHaveBeenCalledWith(id);
    expect(mockCategoryRepository.delete).toHaveBeenCalledWith(id);
  });

  it('CA4 — debería lanzar NotFoundException si no existe', async () => {
    mockCategoryRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('invalid-id')).rejects.toThrow(
      NotFoundException,
    );
    expect(mockCategoryRepository.delete).not.toHaveBeenCalled();
  });
});
