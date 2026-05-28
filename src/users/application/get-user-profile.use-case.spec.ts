import { Test, TestingModule } from '@nestjs/testing';
import { GetUserProfileUseCase } from './get-user-profile.use-case';
import { USER_REPOSITORY } from '../domain/user.repository.interface';

describe('GetUserProfileUseCase — HUMP01 (Perfil de Usuario)', () => {
  let useCase: GetUserProfileUseCase;

  const mockUserRepository = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserProfileUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
      ],
    }).compile();

    useCase = module.get<GetUserProfileUseCase>(GetUserProfileUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(useCase).toBeDefined();
  });

  it('CA5 — debería llamar a userRepository.findById y devolver el perfil del usuario', async () => {
    const userId = 'user-123';
    const fakeUser = {
      id: userId,
      name: 'Miguel',
      lastName: 'Ángel',
      email: 'miguel@gmail.com',
      role: 'CLIENT',
      points: 100,
    };

    mockUserRepository.findById.mockResolvedValue(fakeUser);

    const result = await useCase.execute(userId);

    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    expect(result).toEqual(fakeUser);
  });
});
