import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ValidateCouponUseCase } from './application/validate-coupon.use-case.js';
import { CreateCouponUseCase } from './application/create-coupon.use-case.js';
import { ListCouponsUseCase } from './application/list-coupons.use-case.js';
import { UpdateCouponUseCase } from './application/update-coupon.use-case.js';
import { DeleteCouponUseCase } from './application/delete-coupon.use-case.js';
import { CreateCouponDto } from './dto/create-coupon.dto.js';
import { UpdateCouponDto } from './dto/update-coupon.dto.js';
import { ValidateCouponDto } from './dto/validate-coupon.dto.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator.js';
import { ApiResponse } from '../common/dto/api-response.dto.js';

@Controller('coupons')
export class CouponsController {
  constructor(
    private readonly validateCoupon: ValidateCouponUseCase,
    private readonly createCoupon: CreateCouponUseCase,
    private readonly listCoupons: ListCouponsUseCase,
    private readonly updateCoupon: UpdateCouponUseCase,
    private readonly deleteCoupon: DeleteCouponUseCase,
  ) {}

  /** POST /coupons — Crear cupón (admin, CU05) */
  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() dto: CreateCouponDto) {
    const coupon = await this.createCoupon.execute({
      code: dto.code,
      expirationDate: new Date(dto.expirationDate),
      couponQuantity: dto.couponQuantity,
      minimumAmount: dto.minimumAmount,
      discountAmount: dto.discountAmount,
      discountType: dto.discountType ?? 'fixed',
      categoryId: dto.categoryId,
    });
    return ApiResponse.created(coupon, 'Cupón creado exitosamente');
  }

  /** GET /coupons — Listar todos los cupones (admin) */
  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async findAll() {
    const coupons = await this.listCoupons.execute();
    return ApiResponse.ok(coupons);
  }

  /** PATCH /coupons/:id — Actualizar cupón (admin) */
  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    const data: any = { ...dto };
    if (dto.expirationDate) data.expirationDate = new Date(dto.expirationDate);
    const coupon = await this.updateCoupon.execute(id, data);
    return ApiResponse.ok(coupon, 'Cupón actualizado exitosamente');
  }

  /** DELETE /coupons/:id — Eliminar cupón (admin) */
  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.deleteCoupon.execute(id);
    return ApiResponse.ok(null, 'Cupón eliminado exitosamente');
  }

  /** POST /coupons/validate — Validar cupón en el carrito (cliente, CU06) */
  @Post('validate')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async validate(
    @Body() dto: ValidateCouponDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.validateCoupon.execute(dto.code, user.userId);
    return ApiResponse.ok(result);
  }
}
