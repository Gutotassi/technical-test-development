import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { IngressoEntity } from '../Ingresso/ingresso.entity';

export enum PedidoStatus {
  PENDENTE = 'PENDENTE',
  PAGO = 'PAGO',
  CANCELADO = 'CANCELADO',
  FALHA_ENVIO_EMAIL = 'FALHA_ENVIO_EMAIL',
}

@Entity('pedidos')
export class PedidoEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  clienteEmail!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  valorTotal!: number;

  @Column({
    type: 'enum',
    enum: PedidoStatus,
    default: PedidoStatus.PENDENTE,
  })
  status!: PedidoStatus;

  @OneToMany('IngressoEntity', (ingresso: IngressoEntity) => ingresso.pedido)
  ingressos!: IngressoEntity[];

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm!: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm!: Date;
}