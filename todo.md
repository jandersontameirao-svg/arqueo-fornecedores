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
