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
