import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PedidoEntity, PedidoStatus } from './pedido.entity';

@Injectable()
export class PedidoService {
  constructor(
    @InjectRepository(PedidoEntity)
    private readonly pedidoRepository: Repository<PedidoEntity>,
  ) {}

  async criar(data: { clienteEmail: string; valorTotal: number }): Promise<PedidoEntity> {
    const novoPedido = this.pedidoRepository.create({
      ...data,
      status: PedidoStatus.PENDENTE,
    });

    return await this.pedidoRepository.save(novoPedido);
  }

  async buscarTodos(): Promise<PedidoEntity[]> {
    return await this.pedidoRepository.find({
      relations: {
        ingressos: true,
      },
    });
  }

  async buscarPorId(id: string): Promise<PedidoEntity> {
    const pedido = await this.pedidoRepository.findOne({
      where: { id },
      relations: {
        ingressos: true,
      },
    });

    if (!pedido) {
      throw new NotFoundException(`Pedido com ID ${id} não encontrado.`);
    }

    return pedido;
  }
}