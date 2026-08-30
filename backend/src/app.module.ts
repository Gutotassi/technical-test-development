import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailModule } from './Email/email.module';
import { IngressoModule } from './Ingresso/ingresso.module';
import { PedidoModule } from './Pedido/pedido.module';
import { WebhookModule } from './Webhook/webhook.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidoEntity } from './Pedido/pedido.entity';
import { IngressoEntity } from './Ingresso/ingresso.entity';
import { SetorEntity } from './Setor/entities/setor.entity';
import { BullModule } from '@nestjs/bullmq';
import { EmailLogEntity } from './Email/email-log.entity';
import { WebhookEventEntity } from './Webhook/webhook-event.entity'; 

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'meubanco_redis'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'meubanco_postgres',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'meudev',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE || 'meudatabase',
      entities: [PedidoEntity, IngressoEntity, SetorEntity, EmailLogEntity, WebhookEventEntity], // <-- Adicione as entidades
      synchronize: true,
    }),
    EmailModule,
    IngressoModule,
    PedidoModule,
    WebhookModule,
  ],
})
export class AppModule {}