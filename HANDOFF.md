# Handoff — Arqueo Fornecedores (branch `main`)

_Última atualização: 2026-09-22. **Fonte única: `main`** (produção e deploy saem dela). `feat/vrm-modules` foi integrada e fica igual a `main`; trabalho novo = branch curta a partir de `main` → PR → merge. CI (check + test) roda em todo push/PR._

## 1. Visão geral
Projeto: gestão de fornecedores (VRM). Stack: React + tRPC + Drizzle/MySQL, deploy VPS via **PM2** atrás de Nginx. Porta = env `PORT` (produção); Nginx `proxy_pass` aponta para ela.
Site: https://arqueofornecedores.arqueoportfolio.com.br

## 2. O que foi construído nesta branch (12 commits)
**Módulos VRM novos (aditivos, inspirados no lt-vrm):**
- **Score de Risco 0–1000** — `server/riskScore.ts`, router `risk`, `client/src/components/RiskScorePanel.tsx`, aba "Risco".
- **Risk Register / Issues** — `server/supplierRisks.ts`, router `risks`, `SupplierRisksPanel.tsx`.
- **Assessments / Questionários** — `server/assessments.ts`, routers `assessmentTemplates` + `assessments` (com portal público `portalGet`/`portalSubmit`), página pública `/assessment/:token` (`AssessmentPortal.tsx`), aba "Questionários".
- **Offboarding** — `server/offboarding.ts`, router `offboarding`, `SupplierOffboardingPanel.tsx`, aba "Offboarding".
- **Import CSV em lote** — router `suppliers.importBatch`, `ImportSuppliersDialog.tsx`.

**Atena (assistente de IA) — `server/atena.ts` + `client/src/components/AtenaAssistant.tsx`:**
- Consciência do site: injeta auditoria (quem fez o quê), estatísticas e **detector de inconsistências**.
- Opera via tool-calling respeitando o cargo: leitura=todos; escrita=gestor/admin; aprovar/rejeitar=admin (com audit `via: Atena`).
- Ferramentas: find_supplier, supplier_summary, list_pending_approvals, list_expiring, list_open_alerts, list_assessment_templates, recompute_risk_score, create_risk, send_assessment, start_offboarding, resolve_alert, approve/reject_supplier, deliver_document, **e contratos: list_contracts, get_contract, review_contract (heurístico 12 cláusulas), update_contract (versiona + audit)**.
- **Documentos**: anexa PDF/DOCX/TXT/MD/CSV (extraídos via `extractTextFromBuffer`), entende e devolve documento editado para download (`deliver_document`).
- **Voz**: Web Speech do navegador (STT/TTS), pt-BR.
- **Avatar**: foto em `client/public/atena.jpg`. Posição: canto inferior **esquerdo**.
- **Histórico persistido por usuário** (tabela `atena_chats`). Exclusão permitida SÓ para `fernanda@arqueoproject.com.br` e `janderson@grupoarqueo.com.br` (allowlist em `shared/atenaChat.ts`); `gentegestao@` e `financeiro@` sempre mantêm, sem botão excluir. Endpoint `clearHistory` também bloqueia via API.

**Limpeza/consolidação:**
- Removido router morto `complianceAudit` (duplicado de `audit`).
- 3 vias de cadastro unificadas no menu "Adicionar fornecedor" (manual/IA/CSV).
- Typecheck **100% limpo** (erros pré-existentes de tenant-guard/clicksign corrigidos).

**Config de modelo:** `resolveModel()` lê `OPENAI_MODEL` (default gpt-4o-mini). Para gpt-5.x usa `max_completion_tokens` + `reasoning_effort: "none"` com tools. Flag legado: `OPENAI_USE_MAX_TOKENS=1`.

## 3. Banco — tabelas novas (6)
`supplier_risk_scores`, `supplier_risks`, `assessment_templates`, `supplier_assessments`, `offboarding_checklists`, `atena_chats`.
Migração: **NÃO usar `pnpm db:migrate`** (a migração 0000 do drizzle é um dump de introspecção comentado e quebra). Usar o runner idempotente.

## 4. Deploy na VPS (checklist)
```bash
cd /var/www/arqueo-fornecedores
git checkout main
bash scripts/deploy.sh                   # pull + install + migração idempotente + build (c/ typecheck) + pm2
# --- equivalente manual ---
# git pull origin main && pnpm install --frozen-lockfile
# node scripts/run-vrm-migration.mjs    # cria as 6 tabelas (idempotente)
# .env (uma vez):
grep -q '^OPENAI_API_KEY=' .env || echo 'OPENAI_API_KEY=SUA_CHAVE' >> .env
grep -q '^OPENAI_MODEL='   .env || echo 'OPENAI_MODEL=gpt-5.6-sol' >> .env
# pnpm build                            # ESSENCIAL (agora roda tsc antes; build:fast pula)
# pm2 restart arqueo-fornecedores && pm2 save
```
Validar: `ls -la dist/public/index.html` (data atual), `grep -rl atena.jpg dist/public/assets/*.js`, Ctrl+Shift+R no browser.

## 5. Pendências / próximos passos sugeridos
- **Automação #1 (recomendada, alto ROI)**: jobs agendados (cron) — as funções `checkAndNotify*` em `server/notifications.ts` já existem; falta agendar (varrer vencimentos/alertas sozinho).
- **Automação #2**: recalcular risco automaticamente em eventos (upload de doc, nova avaliação, novo alerta).
- **Fonte de verdade única** (médio risco, exige backup+backfill): criticidade só no vínculo; "status efetivo" derivado; aposentar campos de escopo legados (`groupId`/`companyId` string) → `organizationalGroupId`.
- **Documentos de saída** da Atena: hoje só texto/markdown; opção de gerar .docx/.pdf (pdfkit já disponível).
- **Voz Astra (gpt-6)**: só quando quiser voz realtime (custo $10/$50 por 1M). Hoje Web Speech (grátis).

## 6. Limitações honestas
- Histórico da Atena guarda só texto (role+content, últimas 200); anexos/documentos gerados não são persistidos.
- Contexto do documento anexado vale para o turno do anexo (reanexar para nova rodada de edição).
- `pnpm dev` no Windows quebra (`NODE_ENV=` estilo Unix); usar `npx tsx server/_core/index.ts` no Git Bash. Na VPS Linux funciona.
