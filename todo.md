# Gestão de Fornecedores Arqueo - TODO

## Sistema de Autenticação e RBAC
- [x] Sistema de autenticação com JWT
- [x] Controle de acesso baseado em perfis (RBAC) - Administrador, Gestor, Leitura
- [x] Middleware de autorização por perfil

## Gestão de Usuários
- [x] Cadastro de usuários
- [x] Perfis de permissão configuráveis
- [x] Controle de acesso granular
- [x] Listagem e edição de usuários

## Cadastro de Fornecedores
- [x] Cadastro centralizado com informações de contato
- [x] Dados fiscais (CNPJ, Inscrição Estadual)
- [x] Dados bancários
- [x] Listagem e busca de fornecedores
- [x] Edição e exclusão de fornecedores

## Portal de Onboarding
- [x] Auto-cadastro para fornecedores
- [x] Submissão de documentos iniciais
- [x] Workflow de aprovação de cadastro

## Gestão de Documentos
- [x] Upload de documentos para S3
- [x] Controle de versão de documentos
- [x] Alertas de expiração para contratos e certidões
- [x] Visualização e download de documentos

## Categorização e Segmentação
- [x] Categorização por tipo (serviços, matérias-primas, tecnologia)
- [x] Classificação por criticidade
- [x] Filtros e relatórios por categoria

## Workflows de Aprovação
- [x] Workflows configuráveis para homologação
- [x] Etapas de aprovação com responsáveis
- [x] Notificações de pendências

## Conformidade e Auditoria
- [x] Trilhas de auditoria digital
- [x] Alertas automáticos de documentos vencidos
- [x] Monitoramento de conformidade

## Histórico de Interações
- [x] Registro centralizado de comunicações
- [x] Timeline de eventos por fornecedor
- [x] Anexos em interações

## Avaliação de Desempenho
- [x] Scorecards com KPIs personalizados
- [x] Avaliações periódicas
- [x] Relatórios de performance
- [x] Dashboard de indicadores

## Interface Frontend
- [x] Dashboard principal com métricas
- [x] Layout responsivo e profissional
- [x] Navegação intuitiva
- [x] Temas corporativos

## Testes
- [x] Testes unitários para routers
- [x] Testes de autenticação
- [x] Testes de autorização RBAC

## Melhorias Solicitadas (v1.1)
- [x] Cadastrar categorias iniciais de fornecedores (Serviços, Matérias-primas, Tecnologia, Logística)
- [x] Configurar sistema de notificações por email para alertas
- [x] Ajustar layout da página de usuários conforme exemplo (badges coloridos, layout de tabela)

## Melhorias Solicitadas (v1.2)
- [x] Atualizar identidade visual com cores do Grupo Arqueo (bordô, laranja, azul, amarelo)
- [x] Implementar upload de documentos com drag-and-drop no cadastro de fornecedores
- [x] Gestão de data de validade de documentos com alertas automáticos
- [x] Enviar alertas por email para gestor e fornecedor quando documentos vencerem
- [x] Implementar relatórios exportáveis em Excel/CSV

## Melhorias Solicitadas (v1.3) - Área do Fornecedor
- [x] Criar painel centralizado de gestão do fornecedor
- [x] Área dedicada para upload e gestão de documentos com drag-and-drop
- [x] Seção de contatos do fornecedor
- [x] Histórico de interações e comunicações
- [x] Avaliações de desempenho do fornecedor
- [x] Workflow de aprovação/homologação visível
- [x] Navegação por abas ou seções dentro da área do fornecedor
- [x] Resumo/overview com indicadores do fornecedor

## Melhorias Solicitadas (v1.4) - Reorganização do Menu
- [x] Reorganizar menu lateral com submenus em Fornecedores
- [x] Mover Documentos, Aprovações, Conformidade, Interações e Avaliações para dentro de Fornecedores
- [x] Implementar menu colapsável com submenus

## Implementação da Nova Arquitetura (v2.0)

### Menu e Navegação
- [x] Reorganizar menu lateral com "Gestão de Fornecedores" como grupo principal
- [x] Submenu: Cadastro de Fornecedores, Aprovações Pendentes, Conformidade, Avaliações

### Página de Listagem de Fornecedores
- [x] Melhorar tabela com colunas: Nome, CNPJ, Categoria, Status, Criticidade, Ações
- [x] Adicionar filtros avançados (status, categoria, criticidade)
- [x] Botão "Gerenciar" para acesso à página individual
- [x] Ações rápidas na lista

### Página Individual do Fornecedor (Hub de Gestão)
- [x] Cabeçalho fixo com informações essenciais e ações rápidas
- [x] Aba 1: Visão Geral (cards de métricas, timeline, alertas)
- [x] Aba 2: Dados Cadastrais (informações completas editáveis)
- [x] Aba 3: Documentos (upload drag-and-drop, lista com status de validade)
- [x] Aba 4: Contatos (gestão de pessoas de contato)
- [x] Aba 5: Interações (timeline e registro de comunicações)
- [x] Aba 6: Avaliações (scorecard, KPIs, histórico)
- [x] Aba 7: Financeiro/Contratos (contratos ativos, resumo financeiro)
- [x] Aba 8: Workflow (pipeline de aprovação, histórico)

### Melhorias de UX
- [x] Navegação fluida entre abas sem recarregar página
- [x] Indicadores visuais de status e alertas
- [x] Breadcrumb para navegação contextual

## Melhorias Solicitadas (v2.1)

### Fornecedor de Teste
- [x] Cadastrar fornecedor de teste completo
- [ ] Adicionar documentos de exemplo ao fornecedor (upload via interface)
- [x] Adicionar contatos de exemplo
- [x] Registrar interações de exemplo

### Workflow de Aprovação
- [x] Configurar etapas padrão de homologação
- [x] Etapa 1: Análise Documental
- [x] Etapa 2: Validação Fiscal
- [x] Etapa 3: Aprovação Comercial
- [x] Etapa 4: Aprovação Final
- [x] Criar workflow para o fornecedor de teste
- [x] Adicionar avaliação de desempenho de exemplo

## Melhorias Solicitadas (v2.2)

### Logo e Identidade Visual
- [x] Copiar logo do Grupo Arqueo para o diretório public
- [x] Adicionar logo ao cabeçalho do DashboardLayout
- [x] Atualizar favicon com a logo do Grupo Arqueo
- [x] Ajustar título da aplicação no navegador

## Melhorias Solicitadas (v2.3) - Exportação de Dados

### Backend
- [x] Instalar bibliotecas necessárias (exceljs para Excel, pdfkit para PDF)
- [x] Criar serviço de exportação para Excel com formatação
- [x] Criar serviço de exportação para PDF com layout profissional
- [x] Adicionar endpoints tRPC para exportação

### Frontend
- [x] Criar modal/dialog de exportação com opções
- [x] Adicionar seleção de formato (Excel/PDF)
- [x] Implementar filtros de exportação (categoria, status, criticidade)
- [x] Adicionar seleção de campos para exportar
- [x] Botão de exportação na página de listagem de fornecedores
- [x] Feedback visual durante exportação (loading, sucesso, erro)
## Melhorias Solicitadas (v2.4) - Gráficos no Dashboard
- [x] Adicionar gráfico de pizza (donut) para Fornecedores por Categoria usando Recharts
- [x] Adicionar gráfico de barras para Fornecedores por Criticidade usando Recharts
- [x] Tooltips customizados nos gráficos com cores do Grupo Arqueo
- [x] Estado vazio para quando não há dados nos gráficos
- [x] Verificar e confirmar funcionamento do upload de documentos (drag-and-drop + S3)
- [x] Verificar e confirmar funcionamento do fluxo de aprovação
- [x] Verificar e confirmar funcionamento da exportação Excel/PDF
- [x] Confirmar 19 testes unitários passando

## Módulo de Contratos (v3.0)
- [x] Schema de contratos no banco de dados (tabela contracts + contract_items)
- [x] Helpers de banco de dados para contratos (db.ts)
- [x] Endpoints tRPC para contratos (CRUD + geração por IA)
- [x] Modal de seleção de modo de criação (Do Zero, Template, Duplicar, IA)
- [x] Editor de contrato completo com campos estruturados
- [x] Geração de contrato via IA (invokeLLM com dados do fornecedor)
- [x] Listagem de contratos na aba Financeiro do fornecedor
- [x] Testes unitários para o módulo de contratos

## Melhorias v3.1 - Aditivos, Templates e PDF com IA
### Módulo de Aditivos
- [ ] Schema contract_amendments e financial_milestones no banco
- [ ] Helpers db.ts para aditivos e marcos financeiros
- [ ] Endpoints tRPC para aditivos (CRUD, tipo financeiro/escopo)
- [ ] Frontend: listagem e criação de aditivos dentro do contrato
- [ ] Marcos financeiros com valor previsto/pago e flag de atraso
### Gerenciador de Templates
- [ ] Página dedicada de templates em Configurações ou menu lateral
- [ ] CRUD de templates (criar, editar, excluir)
- [ ] Geração de template por IA com prompt
- [ ] Filtro por tipo de contrato
### Upload de PDF com IA
- [ ] Endpoint tRPC para receber PDF e extrair dados via IA
- [ ] Modal de upload drag-and-drop de PDF
- [ ] Revisão obrigatória dos dados extraídos antes de salvar
- [ ] Criação automática de marcos financeiros identificados pela IA

## Página Home - SelectBusinessUnit (v5.0)
- [x] Tabela business_units no banco de dados
- [x] Tabela companies (empresas vinculadas) no banco de dados
- [x] Helpers db.ts para business_units e companies
- [x] Endpoints tRPC CRUD business_units + getCompanies
- [x] BusinessUnitContext (contexto React)
- [x] CompanyContext (contexto React)
- [x] Classes CSS customizadas Arqueo (bordo, laranja, shadow-warm, etc.)
- [x] Página SelectBusinessUnit como Home (sem Termômetro)
- [ ] Adaptar Dashboard para filtrar por unidade selecionada
- [x] Upload de Word (.docx) como templates na biblioteca

## Reestruturação do Menu (v5.2)
- [x] Menu lateral: Dashboard, Gestão de Fornecedores, Categorias e Templates só visíveis após seleção de unidade de negócio
- [x] Menu lateral: sem unidade ativa, exibir apenas Início e Usuários (e Auditoria/Relatórios globais se aplicável)

## Autopreenchimento com I.A. na Modal de Contrato (v5.3)
- [x] Endpoint tRPC contracts.analyzeFileForAutofill para análise de arquivo com IA
- [x] Componente AIAutoFillSection com estados: inicial, upload, análise, sugestão, erro, sucesso
- [x] Integração do AIAutoFillSection no ContractEditor (modo template)
- [x] Suporte a PDF, DOCX, TXT com extração de dados contratuais
- [x] Revisão obrigatória antes de aplicar sugestões ao formulário

## Auto-Inserção com I.A. na Modal Editar Template (v5.4)
- [ ] Endpoint tRPC templates.analyzeFileForTemplate
- [ ] Componente TemplateAIAutoInsert com 8 estados
- [ ] Integração no topo da modal Editar Template (ContractTemplates.tsx)

## Refatoração Fluxo de Fornecedores (v5.5)
- [x] Botão "Cadastrar Fornecedor" adicionado nos cards de empresa da tela SelectCompany (área externa)
- [x] Menu lateral: "Cadastro de Fornecedores" substituído por "Vincular Fornecedores" (/suppliers/link)
- [x] Schema supplier_links no banco de dados (tabela supplier_links com auditoria)
- [x] Helpers db.ts para supplier_links (CRUD + validação de duplicatas)
- [x] Endpoints tRPC supplierLinks (getBySupplier, getByTargetCompany, getSuppliersByCompanyWithLinks, create, deactivate)
- [x] Validações de negócio: mesmo grupo, sem duplicatas, destino ≠ origem
- [x] Página SupplierLink.tsx com fluxo em 5 etapas (grupo → origem → fornecedor → destino → confirmar)
- [x] Rota /suppliers/link registrada no App.tsx
- [x] Migração do banco executada com sucesso

## Correções de Bugs (v5.6)
- [x] Corrigir erro de INSERT no cadastro de fornecedor (companyId não passado ao backend)
- [x] Adicionar companyId ao supplierSchema no backend (z.string().optional())
- [x] Sanitizar strings vazias para undefined no SupplierForm antes do submit
- [x] Exibir empresa ativa no cabeçalho do SupplierForm
- [x] Varredura completa: todos os 34 endpoints backend verificados e mapeados corretamente

## Segregação por Empresa (v5.7)
- [x] Backend: getDashboardStats aceitar e filtrar por companyId
- [x] Backend: getSuppliersByCategory aceitar e filtrar por companyId
- [x] Backend: getSuppliersByCriticality aceitar e filtrar por companyId
- [x] Backend: getPendingWorkflows aceitar e filtrar por companyId
- [x] Backend: getActiveAlerts aceitar e filtrar por companyId
- [x] Backend: getRecentInteractions aceitar e filtrar por companyId
- [x] Backend: getLatestEvaluations aceitar e filtrar por companyId
- [x] Backend: procedures dashboard/compliance/workflows/evaluations aceitar companyId
- [x] Backend: busca de fornecedores com normalização e escopo obrigatório por empresa
- [x] Frontend: Home.tsx (dashboard) passar companyId em todas as queries
- [x] Frontend: Suppliers.tsx debounce 400ms + companyId na listagem e busca
- [x] Frontend: Approvals.tsx filtrar por empresa ativa
- [x] Frontend: Compliance.tsx filtrar por empresa ativa
- [x] Frontend: Interactions.tsx filtrar por empresa ativa + tipagem explícita
- [x] Frontend: Evaluations.tsx filtrar por empresa ativa + tipagem explícita
- [x] 34 testes passando, 0 erros TypeScript

## Correção INSERT Contracts (v5.8)
- [x] Ampliar campo contractorCnpj de varchar(18) para varchar(500) no schema
- [x] Ampliar campo contractorName de varchar(255) para varchar(1000) no schema
- [x] Ampliar campo contractorRepresentative de varchar(255) para varchar(500) no schema
- [x] Migração aplicada com sucesso (drizzle/0010_lazy_storm.sql)
- [x] Prompt da IA atualizado para lidar com múltiplos contratantes e CNPJs
- [x] 34 testes passando, 0 erros TypeScript

## Correção Campo Estado (v5.9)
- [x] Trocar campo state de Input para Select com todas as 27 UFs brasileiras
- [x] Sanitizar state no handleSubmit: apenas siglas de 2 caracteres são enviadas, "Selecionar" vira undefined
- [x] 34 testes passando, 0 erros TypeScript

## Leitura por IA de Aditivos Contratuais (v5.12)

- [x] Backend: procedure de extração de PDF para aditivos via IA (extractAmendmentFromPDF)
- [x] Backend: upload de PDF de aditivo para S3
- [x] Frontend: componente de upload PDF com drag-and-drop para aditivos
- [x] Frontend: tela de revisão dos dados extraídos pela IA (tipo, valor, prazo, marcos financeiros)
- [x] Frontend: confirmação obrigatória antes de salvar aditivo
- [x] Integração com fluxo existente de aditivos (criar aditivo a partir de PDF)

## Melhorias v5.13 (spec pasted_content_10.txt)

### 1. Notificação de vencimento de documentos (7 dias antes)
- [x] Schema: tabela document_expiration_notifications para rastrear notificações enviadas
- [x] DB: helper para buscar documentos a vencer em 7 dias sem notificação enviada
- [x] DB: helper para marcar notificação como enviada
- [x] Backend: procedure notifications.checkExpiring7Days (job manual + agendado)
- [x] Frontend: indicador visual de documentos a vencer em 7 dias na aba Documentos (via checkExpiring7Days)

### 2. Edição e exclusão de avaliações e contatos
- [x] Backend: procedure evaluations.update (editar avaliação existente com auditoria)
- [x] Backend: procedure evaluations.delete (excluir avaliação com auditoria)
- [x] Frontend: botões Editar e Excluir em SupplierEvaluations com modal de confirmação
- [x] Frontend: modal de edição de avaliação reutilizando formulário existente
- [x] Frontend: modal de confirmação de exclusão de avaliação
- [x] Frontend: modal de confirmação de exclusão de contato

### 3. Anexamento de documentos com leitura por IA na aba de interações
- [x] Schema: adicionar campos attachmentKey, attachmentName e aiExtractedContent em interactions
- [x] DB: updateInteraction já suporta novos campos via Partial<InsertInteraction>
- [x] Backend: procedure interactions.uploadAttachment (upload S3 + extração IA reaproveitando extractTextFromBuffer)
- [x] Frontend: botão de clipe por interação (upload individual com estado de loading)
- [x] Frontend: exibir conteúdo extraído pela IA na interação (toggle "Ver análise IA")
- [x] Frontend: exibir link do anexo com ícone na lista de interações

## Melhorias v5.14 (spec pasted_content_11.txt)

### 1. Vigência efetiva do contrato derivada do aditivo mais recente
- [x] Backend: função getContractEffectiveEndDate(contractId) — retorna vigência efetiva + source + amendmentId/Title
- [x] Backend: função getLatestValidAmendmentWithEndDate(contractId) — aditivo ativo mais recente com newEndDate
- [x] Backend: função getContractsBySupplierWithEffectiveEndDate(supplierId) — listagem com vigência efetiva
- [x] Backend: procedures contracts.listBySupplier e contracts.getById atualizadas
- [x] Backend: procedure contracts.getEffectiveEndDate (nova, para consulta pontual)
- [x] Frontend: SupplierContracts.tsx usa { contract, effectiveEndDate, source, amendmentTitle }
- [x] Frontend: ícone GitBranch + cor azul quando vigência vem de aditivo (tooltip explicativo)
- [x] Frontend: indicador âmbar "Vence em breve" para contratos a vencer em ≤7 dias

### 2. Notificação de vencimento de contrato 7 dias antes
- [x] Schema: tabela contract_expiration_notifications para rastrear envios e evitar duplicidade
- [x] DB: função getContractsExpiringInDaysWithoutNotification(daysAhead)
- [x] DB: função recordContractExpirationNotification
- [x] Backend: função checkAndNotifyExpiringContracts7Days no notifications.ts
- [x] Backend: procedure notifications.checkExpiringContracts7Days no router

## Correções v5.15 (spec pasted_content_12.txt)
- [x] Investigar causa raiz do erro de documentos com tipo diferente de "Outro" (enum do banco não incluía insurance/registration)
- [x] Expandir enum da coluna type em documents para incluir insurance e registration
- [x] Migração aplicada com sucesso (drizzle/0015_groovy_namora.sql)
- [x] Corrigir documentSchema no routers.ts para incluir insurance e registration no z.enum
- [x] Corrigir cast de tipo no upload procedure para incluir insurance e registration
- [x] Reposicionar badge "Principal" de top-3 right-3 para bottom-3 right-3 no card de contato
- [x] 60 testes passando, 0 erros TypeScript

## Evolução v5.16 — Contratos como aba própria + Montagem por template + Clicksign

### 1. Mover contratos de Financeiro para aba própria
- [x] Remover contratos da aba Financeiro (manter financeiro sem contratos)
- [x] Criar nova aba "Contratos" no SupplierDetail com ícone FileSignature
- [x] Preservar todas funcionalidades existentes de contratos

### 2. Montagem de contrato por template com preenchimento automático
- [x] Schema: tabela contract_versions para versionamento
- [x] Schema: tabela contract_signers para signatários
- [x] Schema: tabela contract_clicksign_events para rastrear envios e status
- [x] Backend: extractPlaceholders, fillPlaceholders, mapSystemDataToPlaceholders no db.ts
- [x] Backend: procedure contracts.fillFromTemplate (preencher com dados do sistema + customizados)
- [x] Backend: procedure contracts.createVersion, listVersions
- [x] Frontend: componente TemplatePlaceholderFiller (detectar, preencher, preview, aplicar)
- [x] Frontend: integrado no ContractEditor modo template (após seleção de template)
- [x] Frontend: sinalização visual de placeholders automáticos (verde) vs manuais (âmbar)
- [x] Frontend: preview do conteúdo preenchido com botão "Aplicar ao Contrato"

### 3. Integração Clicksign
- [x] Backend: procedure contracts.sendToClicksign (envio de documento)
- [x] Backend: procedure contracts.addSigner, listSigners, removeSigner
- [x] Backend: procedure contracts.clicksignWebhook (receber status de assinatura)
- [x] Backend: registro de eventos na tabela contract_clicksign_events
- [x] Frontend: ContractViewer com botão "Enviar para Assinatura" + validação
- [x] Frontend: seção de signatários (adicionar, listar, remover)
- [x] Frontend: seção de histórico de versões

### 4. Listagem e filtros na nova aba
- [x] Frontend: listagem de contratos com status, vigência efetiva, indicador de aditivo
- [x] Frontend: indicador visual de vigência derivada de aditivo (azul + GitBranch)
- [x] Frontend: badge "Âmbar" para contratos a vencer em ≤7 dias

### 5. Auditoria e permissões
- [x] Backend: procedures protegidas por managerProcedure (gestor/admin)
- [x] Backend: auditoria via createAuditLog em criação de versão e envio Clicksign
- [x] 78 testes vitest passando, 0 erros TypeScript
- [x] Checkup final completo

## Correção v5.17 — Fluxo Clicksign de ponta a ponta

### 1. Diagnóstico
- [x] Investigar causa raiz: nenhuma chamada real à API Clicksign existia (apenas registros locais)
- [x] Mapear fluxo: faltava criação de envelope, upload de documento, adição de signatários, ativação e notificação
- [x] Documentado em CLICKSIGN_DIAGNOSIS.md

### 2. Schema e modelagem
- [x] contracts: clicksignEnvelopeId, clicksignDocumentId, signatureStatus, sendAttemptCount, lastSendAttemptAt, lastSendError, signedAt
- [x] contractSigners: clicksignSignerId, clicksignRequirementId, signedAt, lastNotifiedAt
- [x] contractClicksignEvents: clicksignEnvelopeId, clicksignDocumentId, errorMessage, httpStatus, requestId + novos eventTypes
- [x] Migração aplicada com sucesso

### 3. Backend — Integração Clicksign real (server/clicksign.ts)
- [x] Serviço clicksign.ts com chamadas reais à API v3: createEnvelope, addDocument, addSigner, addRequirement, activateEnvelope, sendNotification
- [x] Função sendContractToClicksign: fluxo completo de ponta a ponta com rollback em caso de falha
- [x] Validação robusta de e-mail antes do envio (procedure sendToClicksign)
- [x] Validação de conteúdo não vazio, signatários presentes, API configurada
- [x] Persistência de IDs externos (envelopeId, documentId, signerId, requirementId)
- [x] Logs estruturados em todas as etapas ([Clicksign] prefixo)
- [x] Estados: not_sent, sending, sent, partially_signed, signed, refused, cancelled, expired, send_failed
- [x] Procedures: sendToClicksign, resendNotification, cancelClicksign, syncClicksignStatus, isClicksignConfigured, getSignatureStatus
- [x] Webhook handler: server/clicksignWebhook.ts registrado em /api/clicksign/webhook
- [x] Webhook: verificação de assinatura HMAC, atualização de status de signatários e contrato
- [x] Auditoria completa em todas as operações

### 4. Frontend — Feedback real (ContractViewer.tsx)
- [x] Banner de status com 9 estados visuais distintos (cor, ícone, descrição)
- [x] Exibição de envelope ID, tentativas e última tentativa
- [x] Exibição de erro detalhado quando signatureStatus === send_failed
- [x] Botão "Enviar" (not_sent/send_failed) / "Tentar Novamente" (send_failed)
- [x] Botão "Reenviar Notificação" (sent/partially_signed)
- [x] Botão "Cancelar Envio" com confirmação (sent/partially_signed)
- [x] Histórico de eventos com cores por tipo e exibição de erros
- [x] Mutations: cancelClicksign, syncClicksignStatus

### 5. Testes e validação
- [x] 93 testes vitest passando (59 v5 + 34 base)
- [x] Testes: schema com campos de rastreamento
- [x] Testes: serviço clicksign.ts (isConfigured, send, resend, cancel, getDetails, verifyWebhook)
- [x] Testes: db helpers (getContractByClicksignEnvelopeId, updateContractSigner)
- [x] Testes: webhook handler (registerClicksignWebhookRoute)
- [x] Testes: validação de pré-envio (rejeitar quando não configurado)
- [x] 0 erros TypeScript, 0 regressões

## Correções v5.18 (erros reportados 17/04)
- [x] Remover validação de conteúdo obrigatório no sendToClicksign (contrato pode não ter conteúdo ainda)
- [x] Adicionar DialogTitle no estado de loading do ContractViewer (acessibilidade Radix)
- [x] 93 testes passando, 0 erros TypeScript

## Correção v5.19 — URL Clicksign produção
- [x] Diagnosticado: chave de API é de produção (app.clicksign.com), não sandbox
- [x] Testado com 5 formatos de autenticação no sandbox (todos 401)
- [x] Testado com URL de produção — 200 OK com sucesso
- [x] Alterado default de clicksignApiUrl em env.ts de sandbox para app.clicksign.com/api/v3
- [x] Novas credenciais configuradas (CLICKSIGN_API_KEY + CLICKSIGN_WEBHOOK_SECRET)
- [x] Servidor reiniciado, 93 testes passando

## Correção Estrutural v5.21 — Segregação por Grupo e Visibilidade por Empresa

### Problemas a corrigir
- [x] Fornecedores do Grupo Arqueo Brasil aparecem no Grupo Arqueo Africa (vazamento de grupo)
- [x] Fornecedores vinculados a outras empresas não aparecem nas empresas vinculadas

### Schema
- [x] Adicionar campo groupId em suppliers (FK para business_units)
- [x] Migrar dados existentes: popular groupId com base no companyId → mapeamento estático de slugs

### Backend
- [x] Reescrever getAllSuppliers para filtrar por groupId + incluir vínculos via supplier_links
- [x] Reescrever listSuppliers para filtrar por groupId + empresa ativa
- [x] Reescrever dashboard/cards/gráficos para respeitar groupId (getDashboardStats, getSuppliersByCategory, getSuppliersByCriticality)
- [x] Reescrever interações, avaliações e alertas para respeitar groupId (getRecentInteractions, getLatestEvaluations, getActiveAlerts)
- [x] supplierSchema no routers.ts atualizado com groupId: z.number().optional()
- [x] Todas as procedures de listagem/dashboard passam groupId

### Frontend
- [x] SelectedCompanyContext já expõe groupId: number no tipo SelectedCompany
- [x] SelectCompany.tsx já passa groupId={activeUnit?.id || 0} ao criar companyData
- [x] Suppliers.tsx: query com groupId
- [x] Home.tsx: queries de dashboard com groupId
- [x] Compliance.tsx: query com groupId
- [x] Evaluations.tsx: query com groupId
- [x] Interactions.tsx: query com groupId
- [x] SupplierForm.tsx: payload de criação/atualização inclui groupId

### Testes obrigatórios (10 casos — server/group-segregation.test.ts)
- [x] Caso 1: fornecedor do grupo Brasil não aparece no grupo Africa
- [x] Caso 2: listar por groupId retorna apenas fornecedores do grupo correto
- [x] Caso 3: listar por companyId retorna apenas fornecedores daquela empresa
- [x] Caso 4: sem filtro retorna todos os fornecedores
- [x] Caso 5: dashboard stats filtrado por groupId
- [x] Caso 6: categorias de fornecedores filtradas por groupId
- [x] Caso 7: criticidade de fornecedores filtrada por groupId
- [x] Caso 8: interações recentes filtradas por groupId
- [x] Caso 9: avaliações recentes filtradas por groupId
- [x] Caso 10: alertas de compliance filtrados por groupId
- [x] 103 testes passando, 0 erros TypeScript

## Correção v5.22 — Clicksign: documentation e communicate_events
- [x] Corrigido: documentation (CPF/CNPJ) deve ser enviado COM máscara (###.###.###-## / ##.###.###/####-##) — a API Clicksign rejeita dígitos sem pontuação
- [x] Corrigido: communicate_events deve ser um hash com valores string ('email', 'none', etc.) — não booleano
- [x] Adicionada função formatDocumentation() em clicksign.ts que converte dígitos brutos para formato mascarado
- [x] sendContractToClicksign atualizado para passar cpfCnpj bruto (formatDocumentation cuida da máscara internamente)
- [x] Validado com API real Clicksign (201 OK com CPF 083.019.941-18)
- [x] 103 testes passando, 0 erros TypeScript

## Correção v5.23 — Clicksign: role/action, activateEnvelope e geração de PDF real

- [x] addRequirement: action deve ser "agree" e role deve ser "sign" (API v3)
- [x] activateEnvelope: corrigido para PATCH /envelopes/{id} com status "running" (POST /activate não existe na v3)
- [x] generateContractPdf: PDF real gerado com pdfkit a partir dos dados do contrato (título, objeto, partes, valor, datas)
- [x] waitForDocumentReady: aguarda documento ficar ready (até 90s, poll a cada 5s) antes de adicionar signatários e requisitos
- [x] SendContractToClicksignInput: adicionado contractMeta para dados do contrato
- [x] routers.ts: passa contractMeta completo ao sendContractToClicksign
- [x] 103 testes passando, 0 erros TypeScript

## Correção Definitiva Clicksign v5.24 — Resolver TODOS os erros

- [x] Investigar por que documentos ficam em "draft" — não é o PDF, é processamento assíncrono do Clicksign; ativação funciona mesmo com doc em draft
- [x] Causa raiz: faltava requisito de AUTENTICAÇÃO (provide_evidence + email) além do de QUALIFICAÇÃO (agree + sign)
- [x] Corrigir fluxo completo: envelope → documento → signatários → qualificação + autenticação → ativação → notificação
- [x] Testar fluxo completo com API real — SUCESSO (201/200 em TODAS as etapas)
- [x] addQualificationRequirement() + addAuthenticationRequirement() criadas
- [x] sendContractToClicksign() atualizado com ambos os requisitos
- [x] Removido waitForDocumentReady (desnecessário)
- [x] 103 testes passando, 0 erros TypeScript

## Correção Estrutural v5.25 — Visibilidade de Fornecedores por Vínculo (supplier_company_links)

### Problema
- [x] Fornecedor cadastrado na empresa A e vinculado à empresa B não aparecia na empresa B
- [x] A visualização dependia apenas de companyId (origem), ignorando supplier_company_links

### Backend
- [x] getAllSuppliers: já estava correto (diretos + vinculados sem duplicatas)
- [x] getDashboardStats: corrigido para contar fornecedores vinculados + diretos
- [x] getSuppliersByCategory: corrigido para incluir vinculados
- [x] getSuppliersByCriticality: corrigido para incluir vinculados
- [x] getRecentInteractions: corrigido para incluir interações de vinculados
- [x] getLatestEvaluations: corrigido para incluir avaliações de vinculados
- [x] getActiveAlerts: corrigido para incluir alertas de vinculados
- [x] Padrão: getVisibleSupplierIds() coleta IDs diretos + vinculados ativos, usa IN clause

### Frontend
- [x] Todas as páginas já passam companyId corretamente (Suppliers, Home, Compliance, Evaluations, Interactions)

### Testes (server/supplier-link-visibility.test.ts)
- [x] Caso 1: getAllSuppliers retorna diretos + vinculados para empresa de destino
- [x] Caso 2: getDashboardStats conta diretos + vinculados
- [x] Caso 3: getSuppliersByCategory agrupa diretos + vinculados
- [x] Caso 4: getSuppliersByCriticality agrupa diretos + vinculados
- [x] Caso 5: getRecentInteractions inclui interações de vinculados
- [x] Caso 6: getLatestEvaluations inclui avaliações de vinculados
- [x] Caso 7: getActiveAlerts inclui alertas de vinculados
- [x] Caso 8: sem duplicatas quando fornecedor é direto e vinculado
- [x] Caso 9: fornecedor sem vínculo não aparece em empresa alheia
- [x] Caso 10: fornecedor de outro grupo não aparece mesmo com companyId
- [x] 113 testes passando, 0 erros TypeScript

## Auditoria Geral v5.26 — Investigação e Correção de Funcionalidades

- [x] TypeScript: 0 erros em todo o projeto
- [x] Testes: 113 passando, 0 falhas
- [x] Todas as procedures do routers.ts verificadas e conectadas ao db.ts
- [x] Todos os imports do frontend verificados
- [x] Fluxo de contratos, signatários, Clicksign, templates, avaliações, interações, compliance, auditoria, relatórios, export, onboarding, aprovações, categorias, documentos — todos OK
- [x] Bug corrigido: GROUPS no SupplierLink.tsx estava desatualizado (tinha "Grupo Arqueo Africa" que não existe no SelectCompany.tsx) — removido para manter consistência
- [x] Observação: getCompanyById no fillFromTemplate retorna null porque tabela companies está vazia (não é bug, é dado)

## Bloco 1 — Clicksign: Reenvio após Cancelamento de Envelope (v5.27)

- [ ] Backend: detectar envelope cancelado e limpar IDs externos no contrato
- [ ] Backend: permitir novo envio real após cancelamento (novo envelope/fluxo)
- [ ] Backend: adicionar campos cancelled_at, cancelled_by, resent_from_cancelled_envelope, integration_response_snapshot
- [ ] Backend: registrar auditoria de cancelamento e novo envio
- [ ] Backend: logs estruturados de cada etapa
- [ ] Frontend: botão de reenvio funcional após cancelamento
- [ ] Frontend: status refletindo realidade (não travar contrato após cancelamento)
- [ ] Frontend: mensagens de erro claras e feedback real de sucesso
- [ ] Testes: casos de teste para cancelamento + reenvio

## Bloco 2 — Expiração de Documentos: Janela Preventiva 1 ano / Alerta 15 dias (v5.27)

- [ ] Backend: corrigir cálculo — alerta ativo somente com ≤15 dias para vencer
- [ ] Backend: janela preventiva de 1 ano sem gerar alerta crítico
- [ ] Backend: corrigir jobs agendados de notificação (somente ≤15 dias)
- [ ] Backend: corrigir consulta de Alertas Ativos (somente ≤15 dias ou vencidos)
- [ ] Backend: corrigir contadores do dashboard
- [ ] Frontend: aba Alertas Ativos — somente ≤15 dias ou vencidos
- [ ] Frontend: badge "expira em breve" somente ≤15 dias
- [ ] Frontend: coerência entre dashboard, documentos e alertas
- [ ] Testes: casos de teste para as 4 situações de expiração

## Bloco 1 — Clicksign: Reenvio após cancelamento (v5.27)

- [x] cancelClicksign: limpar clicksignEnvelopeId/clicksignDocumentId após cancelamento
- [x] cancelClicksign: resetar todos os signatários para pending (limpar clicksignSignerId/clicksignRequirementId)
- [x] cancelClicksign: registrar cancelled_at, cancelled_by e resentFromCancelledEnvelope no eventData
- [x] sendToClicksign: permitir reenvio quando signatureStatus === "cancelled"
- [x] sendToClicksign: registrar resentFromCancelledEnvelope no evento de auditoria
- [x] ContractViewer: botão de reenvio visível quando status === "cancelled" e há signatários
- [x] ContractViewer: aviso de "adicione signatários" quando cancelado e sem signatários
- [x] ContractViewer: invalidar signers e getSignatureStatus após cancelamento e reenvio

## Bloco 2 — Expiração de documentos: janela crítica 15 dias (v5.27)

- [x] db.ts getExpiringDocuments: padrão alterado de 30 para 15 dias
- [x] db.ts getDashboardStats: getExpiringDocuments(30) → getExpiringDocuments(15)
- [x] db.ts getActiveAlerts: alertas de expiração somente exibidos se dueDate ≤ 15 dias ou vencido
- [x] notifications.ts checkAndNotifyExpiringDocuments: janela alterada de 30 para 15 dias; lista [30,15,7,3,1] → [15,7,3,1]
- [x] notifications.ts sendBatchExpirationNotifications: janela alterada de 30 para 15 dias
- [x] routers.ts upload (base64): alerta criado somente se daysUntilExpiration ≤ 15; severity dinâmica
- [x] routers.ts upload (S3): alerta criado somente se daysUntilExpiration ≤ 15; severity dinâmica
- [x] SupplierDocuments.tsx: isExpiringSoon alterado de 30 para 15 dias
- [x] Documents.tsx: isExpiringSoon alterado de 30 para 15 dias; label filtro atualizado
- [x] SupplierDetail.tsx: expiringDocs alterado de 30 para 15 dias
- [x] Home.tsx: label "expirando em 30 dias" → "expirando em 15 dias"

## CRUD Completo de Usuários (v5.28)

- [x] db.ts: createUser (geração de openId interno, validação de e-mail único)
- [x] db.ts: updateUser (nome, email, role, isActive)
- [x] db.ts: deleteUser (soft delete — isActive = false)
- [x] routers.ts: users.create (adminProcedure + auditoria)
- [x] routers.ts: users.update (adminProcedure + auditoria)
- [x] routers.ts: users.delete (adminProcedure + proteção contra auto-exclusão + auditoria)
- [x] Users.tsx: botão "Novo Usuário" funcional
- [x] Users.tsx: modal de criação com campos nome, email, perfil, status
- [x] Users.tsx: modal de edição completo (todos os campos)
- [x] Users.tsx: confirmação de exclusão (AlertDialog)
- [x] Users.tsx: badge de status ativo/inativo na listagem
- [x] Users.tsx: coluna de status na tabela
- [x] Testes unitários para users.create, users.update, users.delete

## Correção: Sanitização de CNPJ (v5.29)

- [x] routers.ts suppliers.create: sanitizar CNPJ (remover pontos, barra, hífen)
- [x] routers.ts suppliers.update: sanitizar CNPJ se fornecido

## Correção: Card de Alertas Ativos no Dashboard (v5.30)

- [x] db.ts getDashboardStats: aplicar scopeFilter aos alertas ativos (innerJoin com suppliers)
- [x] Alertas agora são contados apenas para fornecedores visiveis (companyId ou groupId)

## Correcao Final: Card de Alertas Ativos - Janela de 15 dias (v5.31)

- [x] db.ts getDashboardStats: aplicar expirationWindowCond (janela de 15 dias) aos alertas
- [x] Alertas agora sao contados apenas se dentro da janela critica (15 dias para expiracao)

## Reestruturação v6.0 — Base Geral de Fornecedores

### Schema e Migração
- [x] Reestruturar suppliers como base geral (CNPJ único, dados gerais)
- [x] Criar tabela supplier_company_links (vínculo por empresa/unidade com dados específicos)
- [x] Migração segura: consolidar duplicados por CNPJ, preservar documentos/contratos/vínculos
- [x] pnpm db:push

### Backend (tRPC)
- [x] Procedures para base geral de fornecedores (CRUD sem empresa)
- [x] Procedures para vínculos por empresa/unidade (criar, editar, remover)
- [x] Procedure "Adicionar fornecedor com IA" (upload doc → extração → busca CNPJ → revisão → vinculação)
- [x] Busca global (fornecedores, CNPJ, documentos, contratos, empresas)
- [x] Permissões por empresa/unidade (visualizar apenas fornecedores vinculados)
- [x] Auditoria expandida (fornecedor criado, vinculado, dados alterados, extração IA)

### Layout e Navegação
- [x] Substituir sidebar por topbar fixa + navegação horizontal + breadcrumbs
- [x] Topbar: Grupo Arqueo Brasil | Unidade atual | Busca global | Notificações | Usuário
- [x] Nav horizontal: Home | Fornecedores | Contratos | Documentos | Avaliações | Relatórios | Configurações

### Home Operacional
- [x] Painel com indicadores (fornecedores homologados, pendentes, docs vencidos, contratos vencendo)
- [x] Ações rápidas: Adicionar com IA, Buscar na base, Vincular existente, Upload documento
- [x] Atividade recente

### Página Completa do Fornecedor
- [x] Abas: Resumo, Dados cadastrais, Documentos, Homologação, Contratos, Vínculos, Avaliações, Histórico
- [x] Documentos gerais vs documentos por vínculo
- [x] Status geral e status por vínculo

### Fluxo "Adicionar Fornecedor com IA"
- [x] Upload de documento (cartão CNPJ, contrato social, NF, proposta, etc.)
- [x] Extração de dados por LLM
- [x] Busca na base geral por CNPJ/CPF
- [x] Se existe: exibir e permitir vincular
- [x] Se não existe: criar pré-preenchido com revisão manual
- [x] Tela de revisão antes de confirmar
- [x] Indicação de campos extraídos vs não identificados

### Experiência Visual
- [x] Aparência moderna sem visual de ERP antigo
- [x] Cards de resumo, badges de status, alertas visuais
- [x] Botão "Adicionar fornecedor com IA" destacado

### Testes e Validação
- [x] Testes unitários atualizados
- [x] TypeScript 0 erros
- [x] Migração segura validada

## Reestruturação SelectCompany (v6.3)
- [x] Exibir dois cards principais ao entrar na unidade: card "Empresas" (lista de empresas) e card "Fornecedores" (contagem total da unidade)

## v6.5 — Remoção de Cadastro de Fornecedor
- [x] Remover botão "Cadastrar Fornecedor" dos CompanyCards na vista de Empresas

## v6.6 — Central de Gestão de Fornecedores da Unidade
- [x] Adicionar businessUnitId como filtro na procedure suppliers.list (alias de groupId)
- [x] Criar página UnitSuppliers com lista consolidada, busca, filtros (status/criticidade/categoria) e botão Novo Fornecedor
- [x] Registrar rota /unit-suppliers no App.tsx
- [x] Card "Fornecedores" no SelectCompany navega diretamente para /unit-suppliers

## v7.0 — Módulo Templates e Contratos (Novo Card + Módulo Completo)
- [ ] Schema: generated_contracts_v2, extraction_runs, extracted_fields, contract_versions_v2
- [ ] DB functions e procedures tRPC para CRUD de templates (já existem parcialmente, expandir)
- [ ] DB functions e procedures tRPC para geração de contratos e vínculo automático com fornecedor
- [ ] Card "Templates e Contratos" na tela SelectCompany (mesmo nível visual dos demais)
- [ ] UI: Módulo Templates e Contratos (listagem, criação, edição, geração de contrato)
- [ ] UI: Gerar contrato para fornecedor já cadastrado (Caminho A)
- [ ] UI: Gerar contrato durante cadastro de novo fornecedor (Caminho B)
- [ ] UI: Preenchimento por IA via PDF (extração, formulário de revisão, score de confiança)
- [ ] Vinculação automática contrato→fornecedor (nunca contrato órfão)
- [ ] Histórico de contratos no perfil do fornecedor (seção fortalecida)
- [ ] Rotas e navegação integradas
- [ ] Testes e verificação de regressão

## v7.0 — Módulo Templates e Contratos (Implementado)
- [x] Schema: template_fields, extraction_runs, extracted_fields + expansão contracts
- [x] DB functions: CRUD template fields, extraction runs, geração de contrato
- [x] Procedures tRPC: getFields, saveFields, extractFromPdf, generateContract, countByBusinessUnit
- [x] Página GenerateContract com wizard 4 etapas (template → fornecedor → campos → revisão)
- [x] Extração por IA via PDF com drag-and-drop, score de confiança e revisão obrigatória
- [x] Card "Templates e Contratos" na tela SelectCompany com contagem dinâmica
- [x] Botão "Gerar via Template" no SupplierContracts (aba Contratos do fornecedor)
- [x] Rota /generate-contract integrada no App.tsx e UNIT_ROUTES
- [x] Breadcrumb "Gerar Contrato" no TopbarLayout

## v7.1 — Cadastrar Fornecedor via I.A.
- [x] Schema: supplier_extraction_runs, supplier_extracted_fields, supplier_document_links + expandir suppliers com registrationOrigin
- [x] Backend: procedures uploadDocsForExtraction, extractSupplierFromDocs, saveSupplierViaAI
- [x] Frontend: botão "Cadastrar via I.A." na listagem de fornecedores (ao lado de Novo Fornecedor)
- [x] Wizard: upload de documentos → extração por IA → revisão no formulário existente → salvamento
- [x] Score de confiança visual por campo (alta/média/baixa/não encontrado)
- [x] Reconhecimento de tipo de documento (CNPJ, CNH, comprovante, currículo, etc.)
- [x] Vinculação de documentos ao fornecedor após salvamento
- [x] Rastreabilidade: origem IA, data, usuário, score, campos revisados
- [x] Tratamento de erros: PDF vazio, ilegível, timeout, conflitos
- [x] Compatibilidade total com fluxo manual existente

## v7.2 — Correção Arqueocean + opção "Ambas as 4 empresas"
- [x] Investigar tabela companies no banco para verificar status da Arqueocean
- [x] Garantir que Arqueocean aparece no dropdown de empresas do wizard Cadastrar via I.A.
- [x] Adicionar opção "Ambas as 4 empresas" exclusiva para cadastros na Grupo Arqueo Brasil

## v7.3 — Opção "Ambas as 4 empresas" no cadastro manual
- [x] Implementar opção "Ambas as 4 empresas" no formulário de cadastro manual de fornecedores

## v7.4 — Remover sidebar lateral
- [x] Remover DashboardLayout (sidebar) de todas as páginas internas
- [x] Manter apenas TopbarLayout (navegação superior)
- [x] Migrar itens de menu do sidebar para o topbar

## v7.5 — Corrigir "Gerar Contrato" ponta a ponta
- [x] Investigar estado atual: GenerateContract.tsx, procedures, schema de contratos
- [x] Corrigir backend: templateId, supplierId, persistência real, validações
- [x] Corrigir frontend: wizard 8 etapas, pré-preenchimento, duplo clique, loading/sucesso/erro
- [x] Vínculo contrato → fornecedor visível no cadastro do fornecedor
- [x] Contrato visível na lista geral de contratos
- [x] Rastreabilidade: templateId, templateName, createdBy, creationMode

## v7.6 — Remover sidebar lateral definitivamente
- [x] Remover DashboardLayout (sidebar fixo) de todas as páginas
- [x] Garantir que apenas TopbarLayout (navegação superior) permanece

## v7.7 — Fix TypeError toLowerCase em GenerateContract
- [x] Corrigir TypeError: Cannot read properties of undefined (reading 'toLowerCase') em GenerateContract.tsx

## v7.8 — Fix missing key prop em GenerateContract
- [x] Corrigir aviso React: Each child in a list should have a unique "key" prop em GenerateContract.tsx

## v7.9 — Fix erro INSERT contracts ao gerar contrato
- [x] Corrigir erro de INSERT na tabela contracts: contracts.content era text (65535 bytes), alterado para longtext (suporta templates de 73545+ chars). Migration 0023 aplicada.

## v7.10 — Fix substituição de placeholders no contrato gerado
- [x] Corrigir lógica de substituição de placeholders em generateContractFromTemplate: dados do fornecedor e filledFields devem substituir os placeholders reais no conteúdo do template

## v7.11 — Auditoria: documentos NUNCA devem ser apagados programaticamente
- [x] Auditar todo o código backend (db.ts, routers.ts) para verificar se alguma operação deleta documentos (supplier_documents, S3)
- [x] Auditar código frontend para verificar se há chamadas de delete em documentos
- [x] Garantir regra absoluta: documentos só podem ser apagados manualmente pelo usuário, NUNCA por código automático

## v7.12 — Segregação de contratos por empresa
- [x] Auditar schema de contratos: verificar se há campo companyId/scope
- [x] Adicionar campo `companyScope` em contracts: "single" (empresa específica) ou "all_group" (todas do Grupo Arqueo Brasil)
- [x] Adicionar campo `contractCompanySlug` em contracts para registrar o slug da empresa de origem
- [x] Migrar schema com pnpm db:push
- [x] Atualizar getContractsBySupplierWithEffectiveEndDate para filtrar por companySlug
- [x] Atualizar listBySupplier procedure para receber companySlug e filtrar
- [x] Atualizar ContractEditor: seletor de escopo (empresa específica vs. todas) + banner informativo
- [x] Exibir contratos na aba Contratos do fornecedor filtrado pela empresa selecionada (companySlug do contexto)

## v7.13 — Correção de contratos + Download PDF
- [x] Corrigir filtro companySlug: contratos com slug NULL devem aparecer para qualquer empresa
- [x] Adicionar endpoint tRPC contracts.generatePDF para gerar PDF do contrato
- [x] Adicionar botão "Baixar PDF" no ContractViewer
- [x] Botão de download em documentos já existia (window.open fileUrl) — confirmado

## v7.14 — PDF real com encoding UTF-8 correto
- [x] WeasyPrint já instalado — usado como engine de PDF (sem puppeteer necessário)
- [x] Corrigir encoding UTF-8: todos os campos escapados com esc() antes de inserir no HTML
- [x] Atualizar contracts.generatePDF para retornar PDF binário (base64) com extensão .pdf
- [x] Atualizar frontend ContractViewer para baixar .pdf real via Blob + URL.createObjectURL

## v7.15 — Segregação estrita por empresa
- [x] Corrigir filtro de contratos: removida inclusão de NULL slug — contratos sem slug NÃO aparecem em nenhuma empresa
- [x] Contratos com companyScope=all_group aparecem em todas as empresas
- [x] Contratos com contractCompanySlug definido só aparecem na empresa correspondente
- [x] ContractPDFImport agora recebe e passa companySlug ao criar contrato via PDF
- [x] Filtro de fornecedores já estava correto (companyId + supplierLinks)

## v7.16 — Mover Templates e Contratos para dentro do fornecedor
- [x] Remover card "Templates e Contratos" da tela SelectUnit (seleção de área de negócio)
- [x] Criar componente SupplierTemplates com CRUD completo de templates + IA + Upload Word
- [x] Adicionar aba "Templates" no SupplierDetail (junto das abas Contratos, Documentos etc.)
- [x] Botão "Gerar Contrato" navega para /generate-contract?supplierId=X
- [x] Botão "Usar Template" navega para /generate-contract?supplierId=X&templateId=Y

## v7.17 — Botão "Usar Template" no Dashboard ao lado de "Novo Fornecedor"
- [x] Remover item "Templates" do menu de navegação superior (TopbarLayout)
- [x] Adicionar botão "Usar Template" com dropdown no Dashboard ao lado de "Novo Fornecedor"
- [x] Dropdown opção 1: "Adicionar novo template" → navega para /contract-templates
- [x] Dropdown opção 2: "Selecionar template" → abre modal com lista de templates para usar

## v7.18 — Validação de Nome de Signatário no Clicksign
- [x] Backend: função validateSignerName() em clicksign.ts (mín. 3 caracteres, contém letra)
- [x] Backend: validação no addSignerToEnvelope() antes de enviar ao Clicksign
- [x] Backend: validação no routers.ts addSigner procedure com Zod refine()
- [x] Frontend: função isValidSignerName() em ContractViewer.tsx
- [x] Frontend: botão "Adicionar" desabilitado se nome inválido + tooltip explicativo
- [x] Erro do Clicksign "name não está em um formato válido" agora bloqueado antes do envio

## v7.19 — Clicksign exige nome completo (nome + sobrenome)
- [x] Backend clicksign.ts: validateSignerName() exigir pelo menos 2 palavras (nome + sobrenome)
- [x] Backend routers.ts: addSigner Zod refine() exigir nome completo
- [x] Frontend ContractViewer.tsx: isValidSignerName() exigir nome completo + mensagem de erro inline

## v7.20 — Retry e timeout na conexão com Clicksign
- [x] CLICKSIGN_API_KEY configurado como secret de produção
- [x] clicksignRequest() com retry automático (3 tentativas, backoff 1s/2s)
- [x] AbortSignal.timeout(30s) para evitar hang indefinido
- [x] Mensagem de erro melhorada com número de tentativas
- [x] Teste de conectividade Clicksign adicionado (clicksign.test.ts)
- [x] Testes: 159 passando

## v7.21 — Isolamento de Escopo: Área / Empresa / Fornecedor
- [x] INVESTIGAÇÃO: schema businessAreas, companies, suppliers — verificar FKs e filtros
- [x] INVESTIGAÇÃO: rotas frontend — verificar uso de ID vs slug/nome
- [x] INVESTIGAÇÃO: queries backend — verificar se filtram por areaId/companyId
- [x] INVESTIGAÇÃO: estado global — verificar se há contaminação de contexto anterior
- [x] CORREÇÃO backend: listCompanies filtrar por businessAreaId obrigatório
- [x] CORREÇÃO backend: listSuppliers filtrar por companyId obrigatório
- [x] CORREÇÃO backend: contadores/stats respeitar companyId
- [x] CORREÇÃO frontend: rota /business-areas/:id não redirecionar para empresa de outra área
- [x] CORREÇÃO frontend: estado vazio correto quando área não tem empresas
- [x] CORREÇÃO frontend: breadcrumbs refletir contexto real
- [x] CORREÇÃO frontend: não reaproveitar estado anterior de outra empresa
- [x] TESTES: isolamento por área e empresa (17 testes — scope-isolation.test.ts)
- [x] VALIDAÇÃO manual completa — 176 testes passando

## v7.22 — Página de Detalhe do Fornecedor: Botão Contrato + Abas
- [x] Corrigir botão "Adicionar contrato" no cabeçalho para ativar aba "Contratos" na mesma página
- [x] Remover aba "Interações" da barra de abas do SupplierDetail
- [x] Remover aba "Vínculos" da barra de abas do SupplierDetail
- [x] Remover aba "Templates" da barra de abas do SupplierDetail
- [x] Fallback seguro: n/a — SupplierDetail usa estado interno (useState), não lê tab da URL
- [x] Ajustar espaçamento da barra de abas após remoção (flex-wrap nativo, sem buracos)
- [x] Preservar todas as funcionalidades internas (TabsContent mantidos, apenas TabsTrigger removidos)

## v7.23 — Correção Cirúrgica: Estado Vazio Incorreto no Grupo Arqueo Brasil
- [x] Diagnosticar lógica hasScope em Suppliers.tsx que bloqueia Grupo Arqueo Brasil
- [x] Corrigir: estado vazio apenas quando área realmente não tem empresas (não quando selectedCompany é null)
- [x] Visão por área (sem empresa selecionada): buscar fornecedores agregados por groupId/areaId
- [x] Visão por empresa: buscar fornecedores por companyId
- [x] Ajustar testes mínimos de regressão (182 testes passando, 6 novos testes v7.23)

## v7.24 — Limpeza de Dados: DELETE em suppliers
- [x] Verificar FKs que referenciam suppliers antes de executar DELETE
- [x] Executar DELETE FROM suppliers (somente tabela de cadastro de fornecedores) — 14 registros removidos
- [x] Confirmar contagem zerada após exclusão — suppliers: 0 registros

## v7.25 — Limpeza de Dados: DELETE em documents
- [x] Identificar tabela de documentos no schema
- [x] Executar DELETE FROM documents e tabelas relacionadas — 135 registros removidos
- [x] Confirmar contagem zerada após exclusão — documents: 0 registros

## v7.26 — Inspeção Profunda: Correções Identificadas
- [x] SupplierDetail.tsx: card "Interações" (linha 344) clica em setActiveTab("interactions") — aba sem TabsTrigger → corrigido: removido cursor-pointer e onClick
- [x] SupplierDetail.tsx: botão "Ver todas" em Últimas Interações (linha 630) → corrigido: navega para /interactions
- [x] clicksign.ts: AbortSignal.timeout reutilizado entre tentativas de retry causando "Body already read" → corrigido: AbortSignal criado dentro do loop por tentativa

## v7.27 — Fix suppliers.getById undefined
- [x] Backend db.ts: getSupplierById retornar null (não undefined) quando não encontrado
- [x] Backend routers.ts: suppliers.getById lançar TRPCError NOT_FOUND quando null
- [x] Frontend SupplierDetail.tsx: tratar estado not-found com mensagem e botão de retorno (isError || !data)

## v7.28 — Suprimir log NOT_FOUND
- [x] SupplierDetail.tsx: onError na query getById não logar erros NOT_FOUND
- [x] Error reporter global: não registrar erros NOT_FOUND como falhas (main.tsx queryCache + mutationCache)

## v7.29 — Inspeção Profunda de Erros
- [ ] notifications.ts: 2 TODO items — envio de email para fornecedor em notificações (linhas 44, 78)
- [ ] SupplierDetail.tsx: 4 instâncias de `any` type — documentos, avaliações, interações (linhas 147, 151, 162, 642)
- [ ] routers.ts: 109 instâncias de `any` — revisar e tipificar adequadamente
- [ ] Verificar cobertura de try-catch em procedures async/await (27 blocos catch identificados)


## v7.30 — Fix "Body Already Read" Error
- [x] clicksign.ts: ler response body uma única vez como text antes de processar
- [x] clicksign.ts: reutilizar bodyText para JSON parsing em erro e sucesso
- [x] Testes: 182 passando, Clicksign connectivity OK

## v7.31 — Fix HTML Error Response from Clicksign
- [x] clicksign.ts: detectar respostas HTML (erro 500/503) e fornecer mensagem clara
- [x] clicksign.ts: log dos primeiros 200 caracteres de resposta HTML para debug
- [x] Mensagem de erro melhorada: "Verifique: (1) URL da API, (2) Chave de API, (3) Status do Clicksign"
- [x] Teste de detecção de resposta HTML adicionado (183 testes passando)

## v7.32 — Fix Endpoint de Notificação Clicksign (404)
- [x] Causa raiz: endpoint `/notifications` não existe na API v3 do Clicksign
- [x] sendNotification: corrigido para POST `/envelopes/{id}/notifications`
- [x] sendNotificationToSigner: novo helper para POST `/envelopes/{id}/signers/{signer_id}/notifications`
- [x] Body simplificado: apenas `{ data: { type, attributes: { message } } }` (sem relationships)
- [x] 183 testes passando, 0 erros TypeScript
