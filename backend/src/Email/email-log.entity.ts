import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EmailStatus {
  PENDENTE = 'PENDENTE',
  SUCESSO = 'SUCESSO',
  FALHA = 'FALHA',
}

@Entity('email_logs')
export class EmailLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'pedido_referencia' })
  pedidoReferencia!: string;

  @Column()
  destinatario!: string;

  @Column({
    type: 'enum',
    enum: EmailStatus,
    default: EmailStatus.PENDENTE,
  })
  status!: EmailStatus;

  @Column({ type: 'text', nullable: true, name: 'erro_mensagem' })
  erroMensagem!: string | null;

  @Column({ default: 1 })
  tentativas!: number;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm!: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm!: Date;
}