import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { PedidoEntity } from '../Pedido/pedido.entity';
import { SetorEntity } from '../Setor/entities/setor.entity';

export enum IngressoStatus {
  VALIDO = 'VALIDO',
  CANCELADO = 'CANCELADO',
  UTILIZADO = 'UTILIZADO',
}

@Entity('ingressos')
export class IngressoEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'pedido_id' })
  pedidoId!: string;

  @Column({ type: 'enum', enum: IngressoStatus, default: IngressoStatus.VALIDO })
  status!: IngressoStatus;

  @Column({ type: 'text' })
  codigoQr!: string;

  @ManyToOne('PedidoEntity', (pedido: PedidoEntity) => pedido.ingressos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pedido_id' })
  pedido!: PedidoEntity;

  @ManyToOne(() => SetorEntity)
  setor!: SetorEntity;

  @CreateDateColumn()
  emitidoEm!: Date;
}