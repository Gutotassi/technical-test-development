import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidoController } from './pedido.controller';
import { PedidoEntity } from './pedido.entity';
import { PedidoService } from './pedido.service';

@Module({
  imports: [TypeOrmModule.forFeature([PedidoEntity])],
  controllers: [PedidoController],
  providers: [PedidoService],
})
export class PedidoModule {}