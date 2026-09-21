# Relatório de Inspeção Profunda — arqueo-fornecedores
**Data:** 2026-05-21 | **Versão inspecionada:** 0d69e424

---

## ERROS ENCONTRADOS

### ERRO 1 — CRÍTICO: Conexão duplicada com o banco de dados
**Arquivos:** `server/orgContext.ts` (linha 30-35) e `server/orgRouter.ts` (linha 38-45)
**Causa raiz:** Ambos os módulos definem um singleton `getDb()` **síncrono** local, em vez de reutilizar o `getDb()` **assíncrono** exportado por `server/db.ts`. Isso cria até 3 conexões separadas com o MySQL, desperdiça recursos e pode causar inconsistências de estado.
**Impacto:** Múltiplas conexões abertas, comportamento imprevisível em produção, sem tratamento de erro de conexão.

---

### ERRO 2 — MÉDIO: Warning de Express deprecated no logout
**Arquivo:** `server/routers.ts` (linha 283)
**Causa raiz:** `res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 })` — o Express 4 deprecou a passagem de `maxAge` em `clearCookie`. O cookie já expira automaticamente ao ser limpo.
**Impacto:** Warning nos logs a cada logout, poluindo o monitoramento.

---

### ERRO 3 — MÉDIO: `createScopedAuditLog` criada mas nunca chamada
**Arquivo:** `server/db.ts` (linha 677)
**Causa raiz:** A função foi criada como wrapper com escopo organizacional, mas os 43 pontos de `createAuditLog` no `routers.ts` ainda chamam a versão sem escopo.
**Impacto:** Audit logs não têm `organizationalGroupId`, `companyId` nem `businessUnitId` preenchidos para ações novas.

---

### ERRO 4 — MÉDIO: `OrgGroupSelector` ausente no `DashboardLayout`
**Arquivo:** `client/src/components/DashboardLayout.tsx`
**Causa raiz:** O seletor de grupo foi adicionado apenas ao `TopbarLayout`, mas o `DashboardLayout` (usado em contextos alternativos) não tem o componente.
**Impacto:** Usuários que acessam via DashboardLayout não veem o seletor de grupo.

---

### ERRO 5 — BAIXO: `@keyframes` fora do `@layer` no index.css
**Arquivo:** `client/src/index.css` (linhas 333-345)
**Causa raiz:** Os `@keyframes arqueoFadeIn` e `arqueoSlideUp` foram definidos fora do bloco `@layer utilities`, enquanto as classes `.animate-arqueo-*` que os referenciam estão dentro do `@layer utilities`. Em Tailwind 4 com PostCSS, keyframes devem estar no escopo global (fora de layers) para serem acessíveis — isso está correto. Sem impacto real, mas é inconsistente com o padrão do projeto.
**Impacto:** Nenhum funcional; apenas inconsistência de organização.

---

### ERRO 6 — BAIXO: `listOrganizationalGroups`, `getOrganizationalGroupById`, `getUserGroupRoles`, `getUserCompanyRoles`, `getUserBusinessUnitRoles` exportadas pelo `orgContext.ts` mas duplicadas no `orgRouter.ts`
**Arquivo:** `server/orgContext.ts` (linhas 282-300) e `server/orgRouter.ts`
**Causa raiz:** As funções helper de consulta foram exportadas pelo `orgContext.ts` mas o `orgRouter.ts` não as usa — reimplementa as queries diretamente.
**Impacto:** Código duplicado, manutenção mais difícil.

---

## RESUMO DE SEVERIDADE

| # | Severidade | Descrição | Status |
|---|-----------|-----------|--------|
| 1 | CRÍTICO | Conexão duplicada com o banco (orgContext + orgRouter têm getDb() próprio) | A corrigir |
| 2 | MÉDIO | Warning Express deprecated no clearCookie com maxAge | A corrigir |
| 3 | MÉDIO | createScopedAuditLog nunca chamada (audit logs sem escopo org) | A corrigir |
| 4 | MÉDIO | OrgGroupSelector ausente no DashboardLayout | A corrigir |
| 5 | BAIXO | Keyframes fora do @layer (organização) | Aceitável |
| 6 | BAIXO | Funções helper duplicadas entre orgContext e orgRouter | A corrigir |

---

## O QUE ESTÁ CORRETO

- TypeScript: 0 erros
- Testes: 350/350 passando (incluindo clicksign que agora passa)
- Schema sincronizado com o banco
- RBAC hierárquico funcional (13 testes unitários)
- Animações de entrada funcionando
- AdminRoute protegendo /audit e /users
- AccessDenied (403) com identidade visual Arqueo
- OrgGroupContext com auto-seleção de grupo padrão
- Rota /403 registrada publicamente
