import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('pedido')
export class PedidoEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  descricao!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  valor!: number;

  @Column({ default: 'PENDENTE' })
  status!: string;

  @CreateDateColumn()
  dataCriacao!: Date;
}