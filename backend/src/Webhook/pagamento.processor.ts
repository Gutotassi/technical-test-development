import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_PAGAMENTOS } from './webhook.constants';
import { PagFacilWebhookDto } from './dto/pagfacil-webhook.dto';
import { IngressoService } from '../Ingresso/ingresso.service';
import { EmailService } from '../Email/email.service';

@Processor(QUEUE_PAGAMENTOS)
export class PagamentoProcessor extends WorkerHost {
  private readonly logger = new Logger(PagamentoProcessor.name);

  constructor(
    private readonly ingressoService: IngressoService,
    private readonly emailService: EmailService,
  ) {
    super();
  }

  async process(job: Job<PagFacilWebhookDto>): Promise<void> {
    const payload = job.data;
    this.logger.log(`[Worker] Processando job ${job.id} - Evento: ${payload.event_type}`);

    const { order_reference } = payload.data;
    const data = payload.data as any;

    switch (payload.event_type) {
      case 'payment.approved':
        this.logger.log(`[Worker] Processando aprovação do pedido: ${order_reference}`);
        
        const setorId = data.setor_id || 'uuid-do-setor';
        const quantidade = data.quantidade || 1;

        // 1. Emite ingressos com trava no Postgres (Anti-overselling)
        await this.ingressoService.processarAprovacaoPagamento(
          order_reference,
          setorId,
          quantidade,
        );

        // 2. Dispara e-mail sem travar ou cancelar a compra em caso de falha
        const emailComprador = data.email_comprador || 'comprador@email.com';
        const simularFalha = data.simular_falha_email || false;
        
        await this.emailService.enviarIngressos(order_reference, emailComprador, simularFalha);
        break; // Impede a execução fall-through para os cases abaixo

      case 'payment.refunded':
      case 'payment.chargeback':
        this.logger.warn(`[Worker] Processando estorno/chargeback do pedido: ${order_reference}`);
        await this.ingressoService.processarEstornoPagamento(order_reference);
        break;

      case 'payment.refused':
        this.logger.log(`[Worker] Pedido ${order_reference} recusado pelo gateway. Nenhuma ação de ingresso requerida.`);
        break;

      default:
        this.logger.warn(`[Worker] Evento não mapeado ignorado: ${payload.event_type}`);
    }
  }
}