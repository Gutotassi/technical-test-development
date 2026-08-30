import { Module } from '@nestjs/common';
import { IngressoService } from './ingresso.service';

@Module({
  providers: [IngressoService],
  exports: [IngressoService],
})
export class IngressoModule {}