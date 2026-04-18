import { IsString, IsNotEmpty } from 'class-validator';

export class ValidateCouponDto {
  @IsString()
  @IsNotEmpty({ message: 'El código del cupón es obligatorio' })
  code: string;
}
