import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailLogEntity, EmailStatus } from './email-log.entity'; // ajuste o nome da sua entity/enum se necessário

@Injectable()
export class EmailService {
  constructor(
    @InjectRepository(EmailLogEntity)
    private readonly emailLogRepository: Repository<EmailLogEntity>,
  ) {}

  async listarFalhas(): Promise<EmailLogEntity[]> {
    // Retorna todos os logs com status FALHA (ou todos se você quiser testar a listagem)
    return await this.emailLogRepository.find({
      where: { status: EmailStatus.FALHA },
      order: { criadoEm: 'DESC' },
    });
  }

  async reenviarEmail(id: string): Promise<EmailLogEntity> {
    const log = await this.emailLogRepository.findOneByOrFail({ id });
    // Lógica para colocar na fila do BullMQ ou reenviar
    log.status = EmailStatus.PENDENTE;
    return await this.emailLogRepository.save(log);
  }
}