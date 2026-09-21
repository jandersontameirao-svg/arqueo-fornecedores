# Relatório de Inspeção Profunda v2 — arqueo-fornecedores

Data: 2026-05-21 | Versão inspecionada: ccb19b7f (v8.3)

---

## ERROS ENCONTRADOS

### ERRO 1 — CRÍTICO (Segurança) — orgContext.ts: group_admin expande apenas o primeiro grupo
**Arquivo:** `server/orgContext.ts` linhas 138–155
**Causa raiz:** `eq(companies.organizationalGroupId, implicitGroupIds[0])` — usa apenas o índice 0 do array de grupos acessíveis. Se um group_admin tiver acesso a múltiplos grupos, apenas o primeiro grupo terá suas empresas/BUs expandidas.
**Impacto:** Usuários group_admin com acesso a múltiplos grupos verão dados incompletos; empresas e BUs dos grupos 2..N não serão acessíveis.
**Correção:** Substituir `eq(..., implicitGroupIds[0])` por `inArray(..., implicitGroupIds)`.

---

### ERRO 2 — CRÍTICO (Segurança) — routers.ts: scope.groupIds vazio → undefined → sem restrição
**Arquivo:** `server/routers.ts` linhas 561, 1041, 2561
**Causa raiz:** `const orgGroupIds = scope.groupIds.length > 0 ? scope.groupIds : undefined` — quando um usuário não tem grupos atribuídos (scope.groupIds = []), orgGroupIds fica `undefined`, e as funções getAllSuppliers/getAllDocuments/getAllContracts tratam `undefined` como "sem restrição" (retornam todos os dados).
**Impacto:** Usuário sem grupos atribuídos vê TODOS os dados de TODOS os grupos — falha de segurança grave.
**Correção:** Substituir por `const orgGroupIds = orgCtx.isSuperAdmin ? undefined : scope.groupIds` — superadmin sem restrição, qualquer outro usuário recebe array (mesmo vazio, que retorna []).

---

### ERRO 3 — ALTO (Lógica) — routers.ts: procedures create não injetam organizationalGroupId
**Arquivo:** `server/routers.ts` — procedures `suppliers.create` (linha ~576), `documents.create` (linha ~1053), `contracts.create` (linha ~1808)
**Causa raiz:** Nenhum dos três procedures de criação injeta `organizationalGroupId` ao criar o registro. Novos registros ficam com `organizationalGroupId = NULL`.
**Impacto:** Registros criados após a migração multi-grupo ficam sem escopo, ficando invisíveis para todos os usuários (pois o filtro `inArray(col, groupIds)` não inclui NULL).
**Correção:** Injetar `organizationalGroupId` do grupo ativo do usuário em cada procedure de criação.

---

### ERRO 4 — ALTO (HMR/DX) — OrgGroupContext.tsx: Fast Refresh incompatível
**Arquivo:** `client/src/contexts/OrgGroupContext.tsx`
**Causa raiz:** O arquivo exporta tanto um componente React (`OrgGroupProvider`) quanto um hook customizado (`useOrgGroupContext`). O Vite Fast Refresh exige que arquivos com componentes exportem APENAS componentes, ou APENAS hooks — não ambos.
**Impacto:** Hot Module Replacement falha com `"useOrgGroupContext" export is incompatible` — toda alteração no arquivo força reload completo da página em vez de atualização parcial.
**Correção:** Separar `useOrgGroupContext` para `client/src/hooks/useOrgGroupContext.ts`.

---

### ERRO 5 — MÉDIO (Segurança) — OrgGroupContext.tsx: chama protectedProcedures sem verificar autenticação
**Arquivo:** `client/src/contexts/OrgGroupContext.tsx` linhas 56–65
**Causa raiz:** `trpc.org.context.useQuery` e `trpc.org.groups.list.useQuery` são chamadas sem `enabled: !!user` — disparadas mesmo quando o usuário não está autenticado. Embora o backend rejeite com UNAUTHORIZED, isso gera erros desnecessários no console e pode causar loops de retry.
**Impacto:** Erros UNAUTHORIZED no console em rotas públicas; possível degradação de performance por retries.
**Correção:** Adicionar `enabled: !!user` nas queries, usando `useAuth()` para verificar autenticação.

---

### ERRO 6 — MÉDIO (Segurança) — fernanda@arqueoproject.onmicrosoft.com tem role='admin' mas não é superadmin
**Banco de dados:** tabela `users`
**Causa raiz:** Existe um usuário `fernanda@arqueoproject.onmicrosoft.com` (diferente de `fernanda@arqueoproject.com.br`) com `role='admin'`. Este email NÃO está na lista branca de superadmins, mas tem o role legado `admin` que dá acesso às rotas `/audit` e `/users` via `AdminRoute` e `adminProcedure`.
**Impacto:** Usuário não autorizado tem acesso a funcionalidades administrativas (gestão de usuários, audit logs completos).
**Correção:** Verificar com o usuário se este email deve ter role='admin' ou deve ser rebaixado para 'manager'/'reader'. Por segurança, manter como está até confirmação — mas documentar o risco.

---

### ERRO 7 — BAIXO (Consistência) — upsertUser não atualiza globalRole para superadmins existentes
**Arquivo:** `server/db.ts` — função `upsertUser`
**Causa raiz:** A lógica de lista branca força `globalRole = 'superadmin_global'` apenas na inserção (INSERT). No UPDATE (quando o usuário já existe), o campo `globalRole` só é atualizado se `isSuperAdmin` for true — mas se o banco tiver um valor diferente, a função `resolveOrgContext` corrige em runtime. Porém, o banco permanece desatualizado.
**Impacto:** Inconsistência entre banco e runtime; logs de auditoria podem mostrar `globalRole` incorreto.
**Correção:** Garantir que o UPDATE também force `globalRole = 'superadmin_global'` para emails da lista branca.

---

## RESUMO

| # | Severidade | Arquivo | Status |
|---|-----------|---------|--------|
| 1 | Crítico | orgContext.ts | Pendente correção |
| 2 | Crítico | routers.ts (3 locais) | Pendente correção |
| 3 | Alto | routers.ts (3 procedures) | Pendente correção |
| 4 | Alto | OrgGroupContext.tsx | Pendente correção |
| 5 | Médio | OrgGroupContext.tsx | Pendente correção |
| 6 | Médio | Banco de dados | Aguarda confirmação do usuário |
| 7 | Baixo | db.ts (upsertUser) | Pendente correção |
