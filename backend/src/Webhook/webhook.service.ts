import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WebhookEventEntity } from './webhook-event.entity';
import { PagFacilWebhookDto } from './dto/pagfacil-webhook.dto';
import { QUEUE_PAGAMENTOS } from './webhook.constants';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(WebhookEventEntity)
    private readonly webhookRepo: Repository<WebhookEventEntity>,
    @InjectQueue(QUEUE_PAGAMENTOS)
    private readonly pagamentosQueue: Queue,
  ) {}

  async processarWebhook(payload: PagFacilWebhookDto): Promise<{ status: string }> {
    const { event_id, event_type } = payload;

    // 1. Checagem de Idempotência
    const eventoExistente = await this.webhookRepo.findOneBy({ eventId: event_id });
    if (eventoExistente) {
      this.logger.log(`Evento duplicado recebido: ${event_id}. Ignorando.`);
      return { status: 'IGNORED_DUPLICATE' };
    }

    // 2. Registra o evento no banco (Idempotência)
    const novoEvento = this.webhookRepo.create({
      eventId: event_id,
      eventType: event_type,
      payload: payload,
    });
    await this.webhookRepo.save(novoEvento);

    // 3. Adiciona na Fila do BullMQ para processamento assíncrono pelos Workers
    await this.pagamentosQueue.add(
      'processar-evento-pagamento',
      payload,
      {
        jobId: event_id, // Evita duplicidade de job no próprio Redis
        attempts: 3,     // Tenta até 3 vezes em caso de falha de conexão/transação
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );

    this.logger.log(`Evento ${event_id} registrado e enfileirado no Redis em < 50ms.`);

    return { status: 'RECEIVED' };
  }
}