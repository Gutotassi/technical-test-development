import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';
import { SetorEntity } from '../Setor/entities/setor.entity';
import { IngressoEntity, IngressoStatus } from './ingresso.entity';

@Injectable()
export class IngressoService {
  private readonly logger = new Logger(IngressoService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Processa a aprovação do pagamento garantindo a trava de capacidade do setor (Anti-Overselling)
   */
  async processarAprovacaoPagamento(pedidoId: string, setorId: string, quantidade: number): Promise<IngressoEntity[]> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Lock Pessimista no Setor (SELECT FOR UPDATE)
      const setor = await queryRunner.manager.findOne(SetorEntity, {
        where: { id: setorId },
        lock: { mode: 'pessimistic_write' }, // Impede outros workers de lerem/alterarem este setor até o COMMIT
      });

      if (!setor) {
        throw new Error(`Setor ${setorId} não encontrado.`);
      }

      // 2. Validação Anti-Overselling
      const ingressosDisponiveis = setor.capacidadeTotal - setor.ingressosVendidos;
      if (ingressosDisponiveis < quantidade) {
        this.logger.error(
          `Overselling Evitado! Setor: ${setor.nome}, Solicitado: ${quantidade}, Disponível: ${ingressosDisponiveis}`,
        );
        throw new Error('Capacidade do setor esgotada.');
      }

      // 3. Incrementa a contagem de ingressos vendidos
      setor.ingressosVendidos += quantidade;
      await queryRunner.manager.save(setor);

      // 4. Emite os ingressos e gera os QR Codes únicos
      const novosIngressos: IngressoEntity[] = [];
      for (let i = 0; i < quantidade; i++) {
        const qrHash = crypto.randomBytes(32).toString('hex');
        
        const ingresso = queryRunner.manager.create(IngressoEntity, {
          pedidoId,
          setor,
          qrCodeHash: qrHash,
          status: IngressoStatus.VALIDO,
        });
        novosIngressos.push(ingresso);
      }

      const ingressosSalvos = await queryRunner.manager.save(IngressoEntity, novosIngressos);

      // 5. Confirma a transação
      await queryRunner.commitTransaction();
      this.logger.log(`Sucesso: ${quantidade} ingressos gerados para o pedido ${pedidoId}`);

      return ingressosSalvos;
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Rollback executado no pedido ${pedidoId}: ${err.message}`);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Cancela ingressos e devolve a capacidade ao Setor em caso de Reembolso / Chargeback
   */
  async processarEstornoPagamento(pedidoId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
    const ingressos = await queryRunner.manager.find(IngressoEntity, {
    where: { 
        pedidoId: pedidoId, 
        status: IngressoStatus.VALIDO 
    },
    relations: { 
        setor: true 
    },
    });

      if (!ingressos || ingressos.length === 0) {
        this.logger.warn(`Nenhum ingresso válido encontrado para estornar no pedido ${pedidoId}`);
        await queryRunner.rollbackTransaction();
        return;
      }

      // Agrupa a devolução por setor
      const setorMap = new Map<string, { setor: SetorEntity; count: number }>();
      for (const ing of ingressos) {
        ing.status = IngressoStatus.CANCELADO;
        if (ing.setor) {
          const current = setorMap.get(ing.setor.id) || { setor: ing.setor, count: 0 };
          current.count += 1;
          setorMap.set(ing.setor.id, current);
        }
      }

      // Salva a alteração de status dos ingressos
      await queryRunner.manager.save(IngressoEntity, ingressos);

      // Atualiza e devolve as vagas aos setores envolvidos com lock
      for (const [setorId, data] of setorMap.entries()) {
        const setor = await queryRunner.manager.findOne(SetorEntity, {
          where: { id: setorId },
          lock: { mode: 'pessimistic_write' },
        });

        if (setor) {
          setor.ingressosVendidos = Math.max(0, setor.ingressosVendidos - data.count);
          await queryRunner.manager.save(setor);
        }
      }

      await queryRunner.commitTransaction();
      this.logger.log(`Estorno concluído com sucesso para o pedido ${pedidoId}`);
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Erro ao estornar o pedido ${pedidoId}: ${err.message}`);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}