import { IsString, IsIn } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn(['EN PROCESO', 'CONFIRMADO', 'ENVIADO', 'FINALIZADO', 'CANCELADO'], {
    message:
      'Estado inválido. Valores permitidos: EN PROCESO, CONFIRMADO, ENVIADO, FINALIZADO, CANCELADO',
  })
  status: string;
}
