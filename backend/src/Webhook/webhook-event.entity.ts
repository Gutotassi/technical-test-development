import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('webhook_events')
export class WebhookEventEntity {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  eventId!: string;

  @Column({ type: 'varchar', length: 50 })
  eventType!: string;

  @Column({ type: 'jsonb' })
  payload!: Record<string, any>;

  @CreateDateColumn()
  recebidoEm!: Date;
}