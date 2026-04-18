import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ValidateCouponUseCase } from './application/validate-coupon.use-case.js';
import { CreateCouponUseCase } from './application/create-coupon.use-case.js';
import { ListCouponsUseCase } from './application/list-coupons.use-case.js';
import { CreateCouponDto } from './dto/create-coupon.dto.js';
import { ValidateCouponDto } from './dto/validate-coupon.dto.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator.js';
import { ApiResponse } from '../common/dto/api-response.dto.js';

@Controller('coupons')
export class CouponsController {
  constructor(
    private readonly validateCoupon: ValidateCouponUseCase,
    private readonly createCoupon: CreateCouponUseCase,
    private readonly listCoupons: ListCouponsUseCase,
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
