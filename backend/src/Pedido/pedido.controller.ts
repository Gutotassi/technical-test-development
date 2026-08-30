import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { PedidoService } from './pedido.service';

@Controller('pedidos')
export class PedidoController {
  constructor(private readonly pedidoService: PedidoService) {}

  @Post()
  async criar(@Body() dto: CreatePedidoDto) {
    return await this.pedidoService.criar({
      clienteEmail: dto.clienteEmail,
      valorTotal: dto.valorTotal,
    });
  }

  @Get()
  async buscarTodos() {
    return await this.pedidoService.buscarTodos();
  }

  @Get(':id')
  async buscarPorId(@Param('id') id: string) {
    return await this.pedidoService.buscarPorId(id);
  }
}