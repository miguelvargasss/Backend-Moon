import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { GetUserProfileUseCase } from './application/get-user-profile.use-case.js';
import { UpdateUserProfileUseCase } from './application/update-user-profile.use-case.js';
import { ListAllUsersUseCase } from './application/list-all-users.use-case.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator.js';
import { ApiResponse } from '../common/dto/api-response.dto.js';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(
    private readonly getUserProfile: GetUserProfileUseCase,
    private readonly updateUserProfile: UpdateUserProfileUseCase,
    private readonly listAllUsers: ListAllUsersUseCase,
  ) {}

  /** GET /users/admin/all — Listar todos los usuarios (solo admin) */
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async findAll() {
    const users = await this.listAllUsers.execute();
    return ApiResponse.ok(users);
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: AuthUser) {
    const profile = await this.getUserProfile.execute(user.userId);
    if (!profile) {
      throw new NotFoundException('Perfil de usuario no encontrado');
    }
    return ApiResponse.ok(profile);
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateUserDto,
  ) {
    const updated = await this.updateUserProfile.execute(user.userId, dto);
    return ApiResponse.ok(updated, 'Perfil actualizado exitosamente');
  }
}
