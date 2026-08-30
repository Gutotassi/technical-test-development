import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { PagFacilWebhookDto } from './dto/pagfacil-webhook.dto';
import { WebhookSignatureGuard } from './guards/webhook-signature.guard';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('pagfacil')
  @UseGuards(WebhookSignatureGuard)
  @HttpCode(HttpStatus.OK)
  async handlePagFacil(@Body() body: PagFacilWebhookDto) {
    return await this.webhookService.processarWebhook(body);
  }
}