import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AddToCartUseCase } from './application/add-to-cart.use-case.js';
import { GetCartUseCase } from './application/get-cart.use-case.js';
import { RemoveFromCartUseCase } from './application/remove-from-cart.use-case.js';
import { UpdateCartItemUseCase } from './application/update-cart-item.use-case.js';
import { ClearCartUseCase } from './application/clear-cart.use-case.js';
import { AddToCartDto } from './dto/add-to-cart.dto.js';
import { UpdateCartItemDto } from './dto/update-cart-item.dto.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator.js';
import { ApiResponse } from '../common/dto/api-response.dto.js';

@Controller('cart')
@UseGuards(AuthGuard)
export class CartController {
  constructor(
    private readonly addToCart: AddToCartUseCase,
    private readonly getCart: GetCartUseCase,
    private readonly removeFromCart: RemoveFromCartUseCase,
    private readonly updateCartItem: UpdateCartItemUseCase,
    private readonly clearCart: ClearCartUseCase,
  ) {}

  /** GET /cart — Carrito del usuario autenticado */
  @Get()
  async findAll(@CurrentUser() user: AuthUser) {
    const items = await this.getCart.execute(user.userId);
    return ApiResponse.ok(items);
  }

  /** POST /cart/items — Agregar producto al carrito */
  @Post('items')
  async add(@CurrentUser() user: AuthUser, @Body() dto: AddToCartDto) {
    const item = await this.addToCart.execute(
      user.userId,
      dto.productId,
      dto.quantity,
      dto.variantId,
    );
    return ApiResponse.created(item, 'Producto agregado al carrito');
  }

  /** PATCH /cart/items/:id — Actualizar cantidad */
  @Patch('items/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateCartItemDto) {
    const item = await this.updateCartItem.execute(id, dto.quantity);
    return ApiResponse.ok(item, 'Cantidad actualizada');
  }

  /** DELETE /cart/items/:id — Eliminar ítem del carrito */
  @Delete('items/:id')
  async remove(@Param('id') id: string) {
    await this.removeFromCart.execute(id);
    return ApiResponse.empty('Ítem eliminado del carrito');
  }

  /** DELETE /cart — Vaciar carrito completo */
  @Delete()
  async clear(@CurrentUser() user: AuthUser) {
    await this.clearCart.execute(user.userId);
    return ApiResponse.empty('Carrito vaciado');
  }
}
