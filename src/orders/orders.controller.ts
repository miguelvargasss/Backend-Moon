import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CreateOrderUseCase } from './application/create-order.use-case.js';
import { ListOrdersUseCase } from './application/list-orders.use-case.js';
import { GetOrderDetailUseCase } from './application/get-order-detail.use-case.js';
import { ListAllOrdersUseCase } from './application/list-all-orders.use-case.js';
import { UpdateOrderStatusUseCase } from './application/update-order-status.use-case.js';
import { ListStatusesUseCase } from './application/list-statuses.use-case.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator.js';
import { ApiResponse } from '../common/dto/api-response.dto.js';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly createOrder: CreateOrderUseCase,
    private readonly listOrders: ListOrdersUseCase,
    private readonly getOrderDetail: GetOrderDetailUseCase,
    private readonly listAllOrders: ListAllOrdersUseCase,
    private readonly updateOrderStatus: UpdateOrderStatusUseCase,
    private readonly listStatuses: ListStatusesUseCase,
  ) {}

  /** POST /orders — Checkout (CU03) */
  @Post()
  @UseGuards(AuthGuard)
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    const result = await this.createOrder.execute(
      user.userId,
      dto.shippingAddressId,
      dto.couponCode,
    );
    return ApiResponse.created(result, 'Pedido creado exitosamente');
  }

  /** GET /orders — Mis pedidos (CU07) */
  @Get()
  @UseGuards(AuthGuard)
  async findMyOrders(@CurrentUser() user: AuthUser) {
    const orders = await this.listOrders.execute(user.userId);
    if (orders.length === 0) {
      return ApiResponse.ok([], 'Aún no has realizado compras');
    }
    return ApiResponse.ok(orders);
  }

  /** GET /orders/admin/all — Todos los pedidos (CU08) */
  @Get('admin/all')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async findAllOrders() {
    const orders = await this.listAllOrders.execute();
    return ApiResponse.ok(orders);
  }

  /** GET /orders/admin/statuses — Todos los estados posibles */
  @Get('admin/statuses')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async findAllStatuses() {
    const statuses = await this.listStatuses.execute();
    return ApiResponse.ok(statuses);
  }

  /** PATCH /orders/admin/:id/status — Cambiar estado (CU08) */
  @Patch('admin/:id/status')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const result = await this.updateOrderStatus.execute(id, dto.status);
    return ApiResponse.ok(result, 'Estado del pedido actualizado');
  }

  /** GET /orders/:id — Detalle de orden (CU07) */
  @Get(':id')
  @UseGuards(AuthGuard)
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const order = await this.getOrderDetail.execute(id, user.userId);
    return ApiResponse.ok(order);
  }
}
