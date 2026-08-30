import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from './email/email.module';
import { IngressoModule } from './ingresso/ingresso.module';
import { PedidoModule } from './pedido/pedido.module';
import { WebhookModule } from './webhook/webhook.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidoEntity } from './pedido/pedido.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'meubanco_postgres',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'meudev',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE || 'meudatabase',
      entities: [PedidoEntity],
      synchronize: true,
    }),
    EmailModule,
    IngressoModule,
    PedidoModule,
    WebhookModule,
  ],
})
export class AppModule {}