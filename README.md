# Tickteira — Core de Vendas e Gestão de Suporte

Este repositório contém a solução desenvolvida para o desafio full-stack da Tickteira, implementando o núcleo transacional de vendas (processamento seguro de webhooks de pagamento, controle de capacidade de setores, prevenção contra overselling/estornos e emissão de ingressos) juntamente com o painel de suporte administrativo para gestão de falhas de e-mail.

## Sumário

- [a) Como executar](#a-como-executar)
- [b) Tecnologias e o porquê de cada uma](#b-tecnologias-e-o-porquê-de-cada-uma)
- [c) Desenho da solução](#c-desenho-da-solução)
- [d) Modos de falha](#d-modos-de-falha)
- [e) Trade-offs](#e-trade-offs)
- [f) Testes realizados](#f-testes-realizados)
- [g) A decisão do e-mail](#g-a-decisão-do-e-mail)
- [h) O que faria diferente com mais tempo](#h-o-que-faria-diferente-com-mais-tempo)

---

## a) Como executar

O projeto foi estruturado para subir inteiramente via Docker Compose, atendendo ao requisito de rodar com um único comando, sem intervenções manuais em múltiplos terminais ou criação prévia de bancos de dados.

### Pré-requisitos

- Docker e Docker Compose instalados na máquina.

### Passo a passo

1. Na raiz do repositório, configure o arquivo `.env` do backend com base no exemplo disponível:

   ```bash
   cp backend/.env.example backend/.env
   ```

2. Execute o comando de inicialização na raiz:

   ```bash
   docker compose up --build
   ```

3. Aguarde o build e a inicialização de todos os containers (PostgreSQL, Redis, Backend NestJS e Frontend Next.js). As migrations do banco de dados e os seeds iniciais rodam automaticamente.

### Portas e acessos

| Serviço | URL / Porta |
|---|---|
| Front-end (Painel de Suporte / Next.js) | http://localhost:3001 |
| Back-end (API / NestJS) | http://localhost:3000 |
| Banco de Dados (PostgreSQL) | localhost:5432 |
| Broker (Redis) | localhost:6379 |

### Como rodar os testes

Para executar os testes automatizados da API no backend:

```bash
cd backend
npm run test
```

### Como disparar os webhooks do gateway (simulação)

Para simular as notificações de pagamento enviadas pela PagFácil (com assinatura HMAC-SHA256 válida gerada via script customizado):

```bash
cd backend
npm run webhook:test
```

---

## b) Tecnologias e o porquê de cada uma

- **NestJS (Back-end)**: escolhido por sua arquitetura modular estrita baseada em TypeScript, injeção de dependências nativa, excelente suporte a filas assíncronas e facilidade para construção de Guards de segurança.
- **Next.js (Front-end)**: utilizado para prover uma interface administrativa leve, ágil e reativa para o time de suporte operar sem fricção.
- **BullMQ + Redis (Fila / Mensageria / Cache)**: escolhido pela robustez no gerenciamento de estados de jobs, persistência nativa em Redis, controle avançado de retentativas (backoff) e alta performance para lidar com picos intensos de requisições.
- **TypeORM + PostgreSQL (Banco de Dados Relacional)**: essencial para garantir transações ACID rigorosas. A integridade relacional é mandatória para evitar overselling (vender mais ingressos do que a capacidade do setor) e para rastrear com precisão o status de pagamentos, estornos e logs de reenvio de e-mail.

---

## c) Desenho da solução

### Modelagem de dados resumida

- **Pedidos (`orders`)**: armazena a referência, o status (`AGUARDANDO_PAGAMENTO`, `CONFIRMADO`, `CANCELADO`, `ESTORNADO`) e os dados do comprador.
- **Ingressos (`tickets`)**: vinculados ao pedido e ao setor, contendo o UUID do QR Code e o status de validade (garantindo a invalidação imediata em caso de estorno ou chargeback).
- **Logs de E-mail (`email_logs`)**: rastreiam cada tentativa de envio, destinatário, status (`SUCESSO`, `FALHA`, `PENDENTE`) e mensagens de erro, servindo de base para listagem e reenvio no painel administrativo.

### Arquitetura síncrona vs. assíncrona

- **Fluxo Síncrono (Webhooks)**: o endpoint `POST /webhooks/pagfacil` valida em tempo real o header de segurança HMAC-SHA256 através do `WebhookSignatureGuard`, checa a idempotência e enfileira o job no BullMQ, respondendo `200 OK` (`{ status: 'RECEIVED' }`) ao gateway em menos de 5 segundos para respeitar o timeout rígido da PagFácil.
- **Fluxo Assíncrono (Workers)**: os workers processam em segundo plano a confirmação de pagamento, a emissão dos ingressos com QR code e o envio dos e-mails, isolando o sistema de picos de tráfego.

---

## d) Modos de falha

- **Falha no Provedor de E-mail**: caso o envio de e-mail falhe, a venda já paga e confirmada não é desfeita. O erro é capturado de forma segura, o log é salvo com status de falha na tabela `email_logs`, e a interface de suporte exibe o registro permitindo o reenvio manual com um clique.
- **Timeout do Webhook (limite de 5s)**: mitigado pelo desacoplamento síncrono/assíncrono com o BullMQ. O servidor responde imediatamente ao gateway e delega o processamento pesado para o background.
- **Eventos Duplicados (at-least-once delivery)**: tratados por meio de restrições de unicidade no banco baseadas no `event_id`, garantindo total idempotência e evitando a emissão duplicada de ingressos.
- **Estornos e Chargebacks (`payment.refunded` / `payment.chargeback`)**: o sistema processa o evento alterando o status correspondente e revogando instantaneamente a validade dos QR codes associados na catraca.

---

## e) Trade-offs

- **Processamento Assíncrono via Fila**: ganho de resiliência extrema e velocidade de resposta imediata ao gateway em momentos de pico. Perda de feedback visual síncrono na requisição HTTP direta do cliente final (compensado por arquitetura baseada em eventos/webhooks).
- **Custo no Pico (8 mil ingressos em 5 minutos)**: para absorver esse platô repentino, a arquitetura aposta em escalabilidade horizontal dos workers do BullMQ e pool otimizado de conexões no PostgreSQL, prevenindo gargalos de concorrência.

---

## f) Testes realizados

- **Testes de Integração e Unidade**: validação robusta do `WebhookSignatureGuard` (assegurando rejeição de assinaturas falsas ou ausentes) e do `EmailService` (tratamento de erros e exceções HTTP 404 para IDs de e-mail inexistentes).
- **O que ficou sem cobertura**: testes de carga automatizados em larga escala simulando simultaneamente os 8 mil acessos em 5 minutos, deixados de fora por limitações do escopo de tempo, mas mapeados para homologação prévia em produção.

---

## g) A decisão do e-mail

- **Decisão**: o e-mail de confirmação e entrega dos ingressos é disparado de forma assíncrona no ato da aprovação do pagamento.
- **Por quê**: atende diretamente ao requisito de agilidade e conversão desejado pelo marketing, sem prejudicar o financeiro ou travar o fluxo de atendimento, uma vez que o envio ocorre em background via fila. Se ocorrer qualquer falha no envio, o pedido permanece seguro e registrado, permitindo que a equipe de suporte realize o reenvio de forma isolada através do painel administrativo.

---

## h) O que faria diferente com mais tempo

- Implementação de um painel de monitoramento de métricas em tempo real (com Prometheus e Grafana) para acompanhar a saúde das filas do BullMQ e a latência dos webhooks recebidos.
- Desenvolvimento de testes de ponta a ponta (E2E) cobrindo todo o ciclo de vida do pedido, desde o gatilho simulado do webhook até a listagem e o reenvio no painel front-end.
