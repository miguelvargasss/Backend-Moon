// Injection token para el repositorio de Auth (Dependency Inversion Principle)
export const AUTH_REPOSITORY = 'AUTH_REPOSITORY';

export interface IAuthRepository {
  login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }>;
  register(email: string, password: string, metadata: { Name: string; LastName: string }): Promise<{ userId: string }>;
  logout(accessToken: string): Promise<void>;
  refreshSession(refreshToken: string): Promise<{ accessToken: string }>;
}
