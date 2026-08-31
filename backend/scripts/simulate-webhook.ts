import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/webhooks/pagfacil';
const WEBHOOK_SECRET = process.env.PAGFACIL_WEBHOOK_SECRET || 'minha_chave_secreta_dev';

const payload = {
  event_id: 'evt_123456',
  event_type: 'payment.approved',
  created_at: new Date().toISOString(),
  data: {
    pedido_id: '123',
    status: 'approved',
  },
};

async function dispararWebhook() {
  const bodyString = JSON.stringify(payload);

  const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(bodyString)
    .digest('hex');

  console.log('--- Disparando Webhook PagFácil ---');
  console.log(`URL: ${WEBHOOK_URL}`);
  console.log(`Signature: ${signature}`);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-pagfacil-signature': signature,
      },
      body: bodyString,
    });

    const data = await response.json();
    console.log(`Status HTTP: ${response.status}`);
    console.log('Resposta:', data);
  } catch (error: any) {
    console.error('Erro ao enviar webhook:', error.message);
  }
}

dispararWebhook();