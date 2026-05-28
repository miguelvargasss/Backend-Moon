import { Test, TestingModule } from '@nestjs/testing';
import { RefreshSessionUseCase } from './refresh-session.use-case';
import { AUTH_REPOSITORY } from '../domain/auth.repository.interface';

describe('RefreshSessionUseCase — HUMP01 (Autenticación)', () => {
  let useCase: RefreshSessionUseCase;

  const mockAuthRepository = {
    refreshSession: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshSessionUseCase,
        { provide: AUTH_REPOSITORY, useValue: mockAuthRepository },
      ],
    }).compile();

    useCase = module.get<RefreshSessionUseCase>(RefreshSessionUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(useCase).toBeDefined();
  });

  it('CA4 — debería llamar a authRepository.refreshSession con el token proporcionado', async () => {
    const fakeToken = 'fake-refresh-token';
    const fakeResponse = { accessToken: 'new-access-token', user: { id: '1' } };

    mockAuthRepository.refreshSession.mockResolvedValue(fakeResponse);

    const result = await useCase.execute(fakeToken);

    expect(mockAuthRepository.refreshSession).toHaveBeenCalledWith(fakeToken);
    expect(result).toEqual(fakeResponse);
  });
});
