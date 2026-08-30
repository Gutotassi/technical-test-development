import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePedidoDto {
  @IsString()
  @IsNotEmpty()
  descricao!: string;

  @IsNumber()
  @IsNotEmpty()
  valor!: number;
}