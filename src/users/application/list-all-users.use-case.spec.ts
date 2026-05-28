import { Test, TestingModule } from '@nestjs/testing';
import { ListAllUsersUseCase } from './list-all-users.use-case';
import { USER_REPOSITORY } from '../domain/user.repository.interface';

describe('ListAllUsersUseCase — HUMP01 (Admin)', () => {
  let useCase: ListAllUsersUseCase;

  const mockUserRepository = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListAllUsersUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
      ],
    }).compile();

    useCase = module.get<ListAllUsersUseCase>(ListAllUsersUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(useCase).toBeDefined();
  });

  it('CA7 — debería llamar a userRepository.findAll y devolver la lista de usuarios', async () => {
    const fakeUsers = [
      { id: '1', name: 'User1' },
      { id: '2', name: 'User2' },
    ];

    mockUserRepository.findAll.mockResolvedValue(fakeUsers);

    const result = await useCase.execute();

    expect(mockUserRepository.findAll).toHaveBeenCalled();
    expect(result).toEqual(fakeUsers);
  });
});
