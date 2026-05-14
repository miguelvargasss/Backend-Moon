import { Test, TestingModule } from '@nestjs/testing';
import { RegisterUseCase } from './register.use-case';
import { AUTH_REPOSITORY } from '../domain/auth.repository.interface';

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;

  // Creamos un Mock (simulacro) del repositorio para no tocar la BD real
  const mockAuthRepository = {
    register: jest.fn(),
  };

  beforeEach(async () => {
    // Configuramos el módulo de pruebas de NestJS
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUseCase,
        {
          provide: AUTH_REPOSITORY,
          useValue: mockAuthRepository,
        },
      ],
    }).compile();

    useCase = module.get<RegisterUseCase>(RegisterUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks(); // Limpiamos los mocks después de cada prueba
  });

  it('debería estar definido', () => {
    expect(useCase).toBeDefined();
  });

  it('debería retornar el nuevo usuario cuando el registro es exitoso', async () => {
    // Arrange (Preparar)
    const email = 'newuser@example.com';
    const password = 'password123';
    const metadata = { Name: 'Miguel', LastName: 'Perez' };
    const role = 'comprador';

    const expectedResult = {
      user: { id: '2', email, role },
      access_token: 'fake-jwt-token',
      refresh_token: 'fake-refresh-token',
    };

    // Simulamos que el repositorio responde correctamente
    mockAuthRepository.register.mockResolvedValue(expectedResult);

    // Act (Actuar)
    const result = await useCase.execute(email, password, metadata, role);

    // Assert (Afirmar)
    expect(result).toEqual(expectedResult);
    expect(mockAuthRepository.register).toHaveBeenCalledWith(
      email,
      password,
      metadata,
      role,
    );
    expect(mockAuthRepository.register).toHaveBeenCalledTimes(1);
  });

  it('debería lanzar un error cuando el repositorio falla (ej. correo ya registrado)', async () => {
    // Arrange (Preparar)
    const email = 'existing@example.com';
    const password = 'password123';
    const metadata = { Name: 'Miguel', LastName: 'Perez' };
    const expectedError = new Error('User already exists');

    // Simulamos que el repositorio falla
    mockAuthRepository.register.mockRejectedValue(expectedError);

    // Act & Assert (Actuar y Afirmar)
    await expect(useCase.execute(email, password, metadata)).rejects.toThrow(
      'User already exists',
    );
    expect(mockAuthRepository.register).toHaveBeenCalledWith(
      email,
      password,
      metadata,
      undefined,
    );
  });
});
