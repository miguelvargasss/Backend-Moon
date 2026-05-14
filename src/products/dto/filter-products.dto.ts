import { IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class FilterProductsDto {
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsUUID('4')
  categoryId?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsUUID('4')
  statusId?: string;
}
