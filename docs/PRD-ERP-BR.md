# PRD - Sistema ERP-BR
## Product Requirements Document

---

## 1. Visão Geral do Produto

### 1.1 Nome do Produto
**ERP-BR** - Sistema de Gestão Empresarial Brasileiro

### 1.2 Descrição
Sistema ERP completo desenvolvido em Next.js com backend em Node.js, focado em gestão de vendas, clientes, produtos e relatórios financeiros para pequenas e médias empresas brasileiras.

### 1.3 Objetivos do Produto
- Fornecer uma solução completa de gestão empresarial
- Simplificar o controle de vendas e estoque
- Automatizar processos financeiros e contábeis
- Oferecer relatórios e dashboards em tempo real
- Garantir facilidade de instalação e uso

### 1.4 Público-Alvo
- Pequenas e médias empresas brasileiras
- Distribuidoras e revendedoras
- Empresas de serviços
- Profissionais autônomos com necessidade de controle financeiro

---

## 2. Especificações Técnicas

### 2.1 Arquitetura
- **Frontend**: Next.js 14 com React e TypeScript
- **Backend**: Node.js com Fastify
- **Banco de Dados**: SQLite com Better-SQLite3
- **UI Framework**: Tailwind CSS + Radix UI + Shadcn/ui
- **Containerização**: Docker e Docker Compose

### 2.2 Requisitos de Sistema
- Node.js 18+
- Docker (opcional, mas recomendado)
- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Mínimo 2GB RAM
- 1GB espaço em disco

### 2.3 Porta e Configuração
- **Porta padrão**: 3145
- **Banco de dados**: SQLite em `../banco-de-dados/erp.sqlite`
- **Configuração**: Variáveis de ambiente via `.env.local`

---

## 3. Funcionalidades Principais

### 3.1 Gestão Multi-Empresa
**Descrição**: Sistema que suporta múltiplas empresas com configurações independentes.

**Funcionalidades**:
- Cadastro de empresas com dados fiscais (CNPJ, Razão Social)
- Configuração de logos e identidade visual
- Isolamento de dados por empresa
- Troca rápida entre empresas

**Critérios de Aceitação**:
- ✅ Usuário pode cadastrar múltiplas empresas
- ✅ Dados ficam isolados por empresa
- ✅ Logo personalizado por empresa
- ✅ Configurações fiscais independentes

### 3.2 Gestão de Clientes
**Descrição**: Cadastro completo de clientes com histórico de relacionamento.

**Funcionalidades**:
- Cadastro com CPF/CNPJ, endereço, telefone, email
- Histórico de compras e relacionamento
- Busca e filtros avançados
- Integração com sistema de vendas

**Critérios de Aceitação**:
- ✅ Cadastro completo de dados do cliente
- ✅ Validação de CPF/CNPJ
- ✅ Histórico de transações
- ✅ Busca por nome, documento ou telefone

### 3.3 Gestão de Produtos
**Descrição**: Controle de catálogo de produtos com preços e categorias.

**Funcionalidades**:
- Cadastro de produtos com preços
- Categorização de produtos
- Controle de estoque básico
- Histórico de alterações de preços

**Critérios de Aceitação**:
- ✅ Cadastro de produtos com nome, preço e categoria
- ✅ Edição e exclusão de produtos
- ✅ Listagem com filtros por categoria
- ✅ Validação de dados obrigatórios

### 3.4 Sistema de Vendas
**Descrição**: Controle completo do processo de vendas.

**Funcionalidades**:
- Registro de vendas com múltiplos itens
- Cálculo automático de totais
- Associação com clientes e produtos
- Controle de quantidades e valores unitários

**Critérios de Aceitação**:
- ✅ Criação de vendas com múltiplos produtos
- ✅ Cálculo automático de totais
- ✅ Validação de estoque (se aplicável)
- ✅ Histórico de vendas por cliente

### 3.5 Sistema de Orçamentos
**Descrição**: Criação e gestão de orçamentos com layout personalizável.

**Funcionalidades**:
- Criação de orçamentos detalhados
- Layout personalizável com cores e tipografia
- Geração de PDF para impressão
- Envio por email
- Controle de validade e status

**Critérios de Aceitação**:
- ✅ Criação de orçamentos com itens
- ✅ Personalização visual do layout
- ✅ Geração de PDF
- ✅ Envio por email configurável
- ✅ Controle de status (pendente, aprovado, rejeitado)

### 3.6 Dashboard e Relatórios
**Descrição**: Visão consolidada dos dados empresariais com métricas em tempo real.

**Funcionalidades**:
- Dashboard com KPIs principais
- Gráficos de vendas e recebimentos
- Relatórios financeiros
- Análise de performance por período

**Critérios de Aceitação**:
- ✅ Dashboard com métricas atualizadas
- ✅ Gráficos interativos
- ✅ Filtros por período
- ✅ Exportação de relatórios

### 3.7 Sistema Financeiro
**Descrição**: Controle completo de recebimentos, pagamentos e fluxo de caixa.

**Funcionalidades**:
- Controle de recebimentos com status
- Gestão de vales (crédito/débito)
- Acertos financeiros com rateio de despesas
- Outros negócios (receitas/despesas extras)

**Critérios de Aceitação**:
- ✅ Registro de recebimentos com datas
- ✅ Sistema de vales por cliente
- ✅ Rateio de despesas em acertos
- ✅ Controle de receitas/despesas extras

### 3.8 Sistema de Backup
**Descrição**: Exportação e importação completa de dados.

**Funcionalidades**:
- Exportação completa em JSON
- Importação com opções de merge/substituição
- Backup automático (futuro)
- Restauração seletiva de dados

**Critérios de Aceitação**:
- ✅ Exportação de todos os dados
- ✅ Importação com validação
- ✅ Opções de merge e substituição
- ✅ Integridade dos dados mantida

### 3.9 Configurações do Sistema
**Descrição**: Configurações gerais e personalizações.

**Funcionalidades**:
- Configuração SMTP para emails
- Personalização de layout de orçamentos
- Configurações fiscais por empresa
- Preferências do usuário

**Critérios de Aceitação**:
- ✅ Configuração de servidor SMTP
- ✅ Teste de envio de email
- ✅ Personalização visual de documentos
- ✅ Salvamento automático de preferências

---

## 4. Requisitos Não-Funcionais

### 4.1 Performance
- Tempo de resposta < 2 segundos para operações básicas
- Suporte a até 10.000 registros por tabela sem degradação
- Otimização de consultas com índices SQLite

### 4.2 Segurança
- Validação de entrada em todos os formulários
- Sanitização de dados SQL
- Configuração segura de CORS
- Logs de auditoria para operações críticas

### 4.3 Usabilidade
- Interface responsiva para desktop e mobile
- Navegação intuitiva com breadcrumbs
- Feedback visual para todas as ações
- Suporte a teclado para acessibilidade

### 4.4 Confiabilidade
- Backup automático do banco de dados
- Recuperação de erros graceful
- Validação de integridade de dados
- Logs detalhados para debugging

### 4.5 Portabilidade
- Instalação automática com um comando
- Suporte a Windows, Linux e macOS
- Containerização com Docker
- Configuração via variáveis de ambiente

---

## 5. Fluxos de Usuário Principais

### 5.1 Fluxo de Primeira Instalação
1. Usuário executa `npm run setup`
2. Sistema verifica dependências (Node.js, Docker)
3. Instala dependências automaticamente
4. Cria estrutura de dados
5. Configura ambiente
6. Inicia aplicação
7. Usuário acessa http://localhost:3145

### 5.2 Fluxo de Criação de Orçamento
1. Usuário acessa página de orçamentos
2. Clica em "Novo Orçamento"
3. Seleciona cliente (ou cadastra novo)
4. Adiciona produtos com quantidades
5. Sistema calcula totais automaticamente
6. Usuário revisa e personaliza layout
7. Salva orçamento
8. Opcionalmente envia por email

### 5.3 Fluxo de Venda
1. Usuário acessa página de vendas
2. Clica em "Nova Venda"
3. Seleciona cliente
4. Adiciona produtos vendidos
5. Confirma quantidades e valores
6. Sistema registra venda
7. Atualiza dashboard automaticamente

---

## 6. Critérios de Sucesso

### 6.1 Métricas de Produto
- **Tempo de instalação**: < 5 minutos
- **Tempo de aprendizado**: < 30 minutos para operações básicas
- **Uptime**: > 99% em ambiente de produção
- **Performance**: < 2s para carregamento de páginas

### 6.2 Métricas de Negócio
- **Adoção**: 100% das funcionalidades utilizáveis
- **Satisfação**: Interface intuitiva e responsiva
- **Produtividade**: Redução de 50% no tempo de gestão manual
- **Escalabilidade**: Suporte a crescimento da empresa

---

## 7. Roadmap e Próximas Funcionalidades

### 7.1 Versão Atual (v1.0)
- ✅ Todas as funcionalidades principais implementadas
- ✅ Sistema multi-empresa
- ✅ Backup/Restore completo
- ✅ Envio de emails
- ✅ Instalação automática

### 7.2 Próximas Versões

**v1.1 - Melhorias de UX**
- [ ] Modo escuro
- [ ] Atalhos de teclado
- [ ] Notificações push
- [ ] Tutorial interativo

**v1.2 - Funcionalidades Avançadas**
- [ ] Integração com APIs de pagamento
- [ ] Sincronização com contabilidade
- [ ] Relatórios avançados com BI
- [ ] App mobile nativo

**v1.3 - Integrações**
- [ ] API REST completa
- [ ] Webhooks para integrações
- [ ] Importação de planilhas
- [ ] Integração com e-commerce

---

## 8. Considerações de Implementação

### 8.1 Ambiente de Desenvolvimento
- Configuração local com `npm run dev`
- Hot reload para desenvolvimento rápido
- Banco SQLite local em `../banco-de-dados/`
- Logs detalhados para debugging

### 8.2 Ambiente de Produção
- Deploy via Docker Compose
- Volumes persistentes para dados
- Configuração via variáveis de ambiente
- Monitoramento de saúde da aplicação

### 8.3 Manutenção
- Backup automático diário
- Logs rotativos
- Monitoramento de performance
- Atualizações sem downtime

---

## 9. Conclusão

O ERP-BR é um sistema completo e robusto que atende às necessidades de gestão empresarial de pequenas e médias empresas brasileiras. Com sua arquitetura moderna, instalação automática e interface intuitiva, oferece uma solução completa para controle de vendas, clientes, produtos e finanças.

O sistema foi projetado com foco na facilidade de uso, performance e escalabilidade, garantindo que possa crescer junto com o negócio do usuário.

---

**Documento gerado em**: Janeiro 2025  
**Versão do PRD**: 1.0  
**Última atualização**: Janeiro 2025