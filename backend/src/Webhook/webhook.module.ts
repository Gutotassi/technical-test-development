import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { WebhookEventEntity } from './webhook-event.entity';
import { QUEUE_PAGAMENTOS } from './webhook.constants';
import { PagamentoProcessor } from './pagamento.processor';
import { IngressoModule } from '../Ingresso/ingresso.module';
import { EmailModule } from '../Email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookEventEntity]),
    BullModule.registerQueue({
      name: QUEUE_PAGAMENTOS,
    }),
    IngressoModule,
    EmailModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService, PagamentoProcessor],
  exports: [WebhookService],
})
export class WebhookModule {}