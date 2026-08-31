import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailLogEntity, EmailStatus } from './email-log.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectRepository(EmailLogEntity)
    private readonly emailLogRepository: Repository<EmailLogEntity>,
  ) {}

  async enviarIngressos(
    orderReference: string,
    emailComprador: string,
    simularFalha = false,
  ): Promise<EmailLogEntity> {
    this.logger.log(`Iniciando envio de e-mail para ${emailComprador} (Pedido: ${orderReference})`);

    const log = this.emailLogRepository.create({
      pedidoReferencia: orderReference,
      destinatario: emailComprador,
      status: EmailStatus.PENDENTE,
      tentativas: 1,
    });

    try {
      if (simularFalha) {
        throw new Error('Falha simulada no serviço de e-mail.');
      }
      
      log.status = EmailStatus.SUCESSO;
      this.logger.log(`E-mail enviado com sucesso para ${emailComprador}`);
    } catch (error: any) {
      log.status = EmailStatus.FALHA;
      log.erroMensagem = error.message || 'Erro desconhecido ao enviar e-mail';
      this.logger.error(`Falha ao enviar e-mail para ${emailComprador}: ${log.erroMensagem}`);
    }

    return await this.emailLogRepository.save(log);
  }

  async listarFalhas(): Promise<EmailLogEntity[]> {
    return await this.emailLogRepository.find({
      where: { status: EmailStatus.FALHA },
      order: { criadoEm: 'DESC' },
    });
  }

  async reenviarEmail(id: string): Promise<EmailLogEntity> {
    // 1. Busca sem lançar exceção do TypeORM
    const log = await this.emailLogRepository.findOneBy({ id });

    // 2. Se não existir, lança 404 HTTP do NestJS
    if (!log) {
      throw new NotFoundException(`Registro de e-mail com ID "${id}" não foi encontrado.`);
    }

    log.status = EmailStatus.PENDENTE;
    log.tentativas += 1;

    try {
      // Tenta reenviar o e-mail
      log.status = EmailStatus.SUCESSO;
      log.erroMensagem = null;
    } catch (error: any) {
      log.status = EmailStatus.FALHA;
      log.erroMensagem = error.message;
    }

    return await this.emailLogRepository.save(log);
  }
}