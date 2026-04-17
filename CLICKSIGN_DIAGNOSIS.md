# Diagnóstico — Fluxo Clicksign não envia e-mail ao destinatário

## Causa raiz identificada

O fluxo atual de envio para assinatura via Clicksign **não faz nenhuma chamada real à API do Clicksign**. A procedure `sendToClicksign` no `routers.ts` (linha 1461-1514):

1. Busca o contrato e signatários do banco
2. Salva uma versão do contrato
3. Cria um evento local na tabela `contract_clicksign_events` com `eventType: "document_created"`
4. Atualiza o status do contrato para `"review"`
5. Cria um log de auditoria
6. Retorna `success: true` com mensagem "Configure a API Key do Clicksign para ativar o envio automático"

**Não existe nenhuma chamada HTTP à API do Clicksign.** O sistema marca o contrato como "enviado" sem ter enviado nada. O frontend exibe "Enviado para assinatura" com base apenas no retorno local.

## Problemas secundários identificados

1. **Sem variável de ambiente para Clicksign** — Não existe `CLICKSIGN_API_KEY`, `CLICKSIGN_API_URL` ou qualquer configuração de ambiente para a integração.

2. **Sem serviço de integração** — Não existe um módulo `server/clicksign.ts` ou similar que encapsule as chamadas à API.

3. **Status falso positivo** — O contrato é marcado como `"review"` (aguardando assinatura) sem confirmação real do Clicksign.

4. **Reenvio simulado** — A procedure `resendToSigner` apenas cria um evento local, sem reenviar nada ao Clicksign.

5. **Sem validação de e-mail** — Não há validação de formato de e-mail antes do envio.

6. **Sem persistência de IDs externos** — Os campos `clicksignDocumentId` na tabela de eventos e `clicksignSignerId` na tabela de signatários nunca são preenchidos com dados reais.

7. **Sem webhook** — Não existe endpoint para receber callbacks do Clicksign sobre mudanças de status.

8. **Sem estados granulares** — O enum de status do contrato não inclui estados como `sending`, `sent_to_clicksign`, `signature_pending`, `partially_signed`, `signed`, `send_failed`, `integration_error`.

9. **Tabela contracts sem campos de rastreamento** — Faltam campos como `clicksignDocumentKey`, `lastSendAttemptAt`, `lastSendError`, `sendAttemptCount`, `signatureStatus`.

10. **Tabela contract_signers sem campos de rastreamento** — Faltam campos como `sentToEmail`, `emailDeliveryStatus`, `notificationEnabled`.

## Plano de correção

1. Adicionar variáveis de ambiente `CLICKSIGN_API_KEY` e `CLICKSIGN_API_URL`
2. Criar serviço `server/clicksign.ts` com chamadas reais à API v1 do Clicksign
3. Expandir enums de status no schema
4. Adicionar campos de rastreamento nas tabelas contracts e contract_signers
5. Reescrever procedures com validação real, chamadas à API, persistência de IDs externos
6. Implementar webhook endpoint para receber status do Clicksign
7. Atualizar frontend com feedback real de status, erro e reenvio
