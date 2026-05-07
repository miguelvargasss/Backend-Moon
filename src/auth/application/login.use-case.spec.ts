import { Test, TestingModule } from '@nestjs/testing';
import { LoginUseCase } from './login.use-case';
import { AUTH_REPOSITORY } from '../domain/auth.repository.interface';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  
  // Creamos un Mock (simulacro) del repositorio para no tocar la BD real
  const mockAuthRepository = {
    login: jest.fn(),
  };

  beforeEach(async () => {
    // Configuramos el módulo de pruebas de NestJS
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        {
          provide: AUTH_REPOSITORY,
          useValue: mockAuthRepository,
        },
      ],
    }).compile();

    useCase = module.get<LoginUseCase>(LoginUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks(); // Limpiamos los mocks después de cada prueba
  });

  it('debería estar definido', () => {
    expect(useCase).toBeDefined();
  });

  it('debería retornar el usuario y token cuando el inicio de sesión es exitoso', async () => {
    // Arrange (Preparar)
    const email = 'test@example.com';
    const password = 'password123';
    const expectedResult = {
      user: { id: '1', email, role: 'comprador' },
      access_token: 'fake-jwt-token',
      refresh_token: 'fake-refresh-token'
    };
    
    // Simulamos que el repositorio responde correctamente
    mockAuthRepository.login.mockResolvedValue(expectedResult);

    // Act (Actuar)
    const result = await useCase.execute(email, password);

    // Assert (Afirmar)
    expect(result).toEqual(expectedResult);
    expect(mockAuthRepository.login).toHaveBeenCalledWith(email, password);
    expect(mockAuthRepository.login).toHaveBeenCalledTimes(1);
  });

  it('debería lanzar un error cuando las credenciales son incorrectas', async () => {
    // Arrange (Preparar)
    const email = 'test@example.com';
    const password = 'wrong-password';
    const expectedError = new Error('Invalid credentials');
    
    // Simulamos que el repositorio falla
    mockAuthRepository.login.mockRejectedValue(expectedError);

    // Act & Assert (Actuar y Afirmar)
    await expect(useCase.execute(email, password)).rejects.toThrow('Invalid credentials');
    expect(mockAuthRepository.login).toHaveBeenCalledWith(email, password);
  });
});
