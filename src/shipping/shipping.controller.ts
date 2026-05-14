import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AddShippingAddressUseCase } from './application/add-shipping-address.use-case.js';
import { ListShippingAddressesUseCase } from './application/list-shipping-addresses.use-case.js';
import { DeleteShippingAddressUseCase } from './application/delete-shipping-address.use-case.js';
import { CreateShippingAddressDto } from './dto/create-shipping-address.dto.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator.js';
import { ApiResponse } from '../common/dto/api-response.dto.js';
import { ShippingAddress } from './domain/shipping-address.entity.js';

@Controller('shipping')
@UseGuards(AuthGuard)
export class ShippingController {
  constructor(
    private readonly addAddress: AddShippingAddressUseCase,
    private readonly listAddresses: ListShippingAddressesUseCase,
    private readonly deleteAddress: DeleteShippingAddressUseCase,
  ) {}

  /** GET /shipping/addresses — Direcciones del usuario */
  @Get('addresses')
  async findAll(@CurrentUser() user: AuthUser) {
    const addresses = await this.listAddresses.execute(user.userId);
    return ApiResponse.ok(addresses);
  }

  /** POST /shipping/addresses — Crear dirección (CU03) */
  @Post('addresses')
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateShippingAddressDto,
  ) {
    const address = await this.addAddress.execute({
      userId: user.userId,
      ...dto,
    } as Omit<ShippingAddress, 'id'>);
    return ApiResponse.created(address, 'Dirección registrada exitosamente');
  }

  /** DELETE /shipping/addresses/:id — Eliminar dirección */
  @Delete('addresses/:id')
  async remove(@Param('id') id: string) {
    await this.deleteAddress.execute(id);
    return ApiResponse.empty('Dirección eliminada');
  }
}
