import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-pagfacil-signature'];
    const secret = process.env.PAGFACIL_WEBHOOK_SECRET || 'secret_dev_key';

    if (!signature) {
      throw new UnauthorizedException('Assinatura ausente.');
    }

    const rawBody = JSON.stringify(request.body);
    const hmac = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (hmac !== signature) {
      throw new UnauthorizedException('Assinatura HMAC inválida.');
    }

    return true;
  }
}