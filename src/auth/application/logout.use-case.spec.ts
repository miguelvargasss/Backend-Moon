import { Test, TestingModule } from '@nestjs/testing';
import { LogoutUseCase } from './logout.use-case';
import { AUTH_REPOSITORY } from '../domain/auth.repository.interface';

describe('LogoutUseCase — HUMP01 (Autenticación)', () => {
  let useCase: LogoutUseCase;

  const mockAuthRepository = {
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutUseCase,
        { provide: AUTH_REPOSITORY, useValue: mockAuthRepository },
      ],
    }).compile();

    useCase = module.get<LogoutUseCase>(LogoutUseCase);
  });

  afterEach(() => jest.clearAllMocks());

  it('debería estar definido', () => {
    expect(useCase).toBeDefined();
  });

  it('debería cerrar la sesión correctamente con un token válido', async () => {
    const token = 'valid-jwt-token';
    mockAuthRepository.logout.mockResolvedValue(undefined);

    await useCase.execute(token);

    expect(mockAuthRepository.logout).toHaveBeenCalledWith(token);
    expect(mockAuthRepository.logout).toHaveBeenCalledTimes(1);
  });

  it('debería propagar el error si el repositorio falla al cerrar sesión', async () => {
    mockAuthRepository.logout.mockRejectedValue(new Error('Token inválido'));

    await expect(useCase.execute('bad-token')).rejects.toThrow('Token inválido');
  });
});
