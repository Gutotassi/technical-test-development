import { Controller, Get, Param, Post } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('admin/emails')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get()
  async listarFalhas() {
    return await this.emailService.listarFalhas();
  }

  @Post(':id/reenviar')
  async reenviarEmail(@Param('id') id: string) {
    const logAtualizado = await this.emailService.reenviarEmail(id);
    return {
      message: 'Reenvio processado com sucesso!',
      data: logAtualizado,
    };
  }
}