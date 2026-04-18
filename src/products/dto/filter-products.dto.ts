import { IsOptional, IsUUID } from 'class-validator';

export class FilterProductsDto {
  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @IsOptional()
  @IsUUID('4')
  statusId?: string;
}
