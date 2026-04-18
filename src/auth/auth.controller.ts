import {
  Controller,
  Post,
  Body,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LoginUseCase } from './application/login.use-case.js';
import { RegisterUseCase } from './application/register.use-case.js';
import { LogoutUseCase } from './application/logout.use-case.js';
import { RefreshSessionUseCase } from './application/refresh-session.use-case.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { ApiResponse } from '../common/dto/api-response.dto.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const result = await this.loginUseCase.execute(dto.email, dto.password);
    return ApiResponse.ok(result, 'Inicio de sesión exitoso');
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const result = await this.registerUseCase.execute(dto.email, dto.password, {
      Name: dto.name,
      LastName: dto.lastName,
    });
    return ApiResponse.created(result, 'Usuario registrado exitosamente');
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Headers('authorization') authHeader: string) {
    const token = authHeader.replace('Bearer ', '');
    await this.logoutUseCase.execute(token);
    return ApiResponse.empty('Sesión cerrada exitosamente');
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    const result = await this.refreshSessionUseCase.execute(dto.refreshToken);
    return ApiResponse.ok(result, 'Token renovado exitosamente');
  }
}
