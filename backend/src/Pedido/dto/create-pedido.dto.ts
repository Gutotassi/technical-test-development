import { IsEmail, IsNumber, IsNotEmpty } from 'class-validator';

export class CreatePedidoDto {
  @IsEmail()
  @IsNotEmpty()
  clienteEmail!: string;

  @IsNumber()
  @IsNotEmpty()
  valorTotal!: number;
}