import { Column, Entity, PrimaryGeneratedColumn, VersionColumn } from 'typeorm';

@Entity('setores')
export class SetorEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  nome!: string;

  @Column({ type: 'int' })
  capacidadeTotal!: number;

  @Column({ type: 'int', default: 0 })
  ingressosVendidos!: number;

  @VersionColumn()
  versao!: number; 
}