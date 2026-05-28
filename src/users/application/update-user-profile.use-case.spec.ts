import { Test, TestingModule } from '@nestjs/testing';
import { UpdateUserProfileUseCase } from './update-user-profile.use-case';
import { USER_REPOSITORY } from '../domain/user.repository.interface';

describe('UpdateUserProfileUseCase — HUMP01 (Perfil de Usuario)', () => {
  let useCase: UpdateUserProfileUseCase;

  const mockUserRepository = {
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUserProfileUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
      ],
    }).compile();

    useCase = module.get<UpdateUserProfileUseCase>(UpdateUserProfileUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(useCase).toBeDefined();
  });

  it('CA6 — debería llamar a userRepository.update y devolver el perfil actualizado', async () => {
    const userId = 'user-123';
    const updateData = { name: 'Nuevo Nombre', lastName: 'Nuevo Apellido' };
    const fakeUpdatedUser = { id: userId, ...updateData };

    mockUserRepository.update.mockResolvedValue(fakeUpdatedUser);

    const result = await useCase.execute(userId, updateData);

    expect(mockUserRepository.update).toHaveBeenCalledWith(userId, updateData);
    expect(result).toEqual(fakeUpdatedUser);
  });
});
