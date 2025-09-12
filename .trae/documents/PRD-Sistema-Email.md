# Sistema de E-mail - Documentação Técnica

## 1. Visão Geral do Produto

Sistema de e-mail integrado ao ERP que permite gerenciar mensagens diretamente no painel administrativo, eliminando a necessidade de alternar entre aplicações externas.

O sistema oferece funcionalidades completas de cliente de e-mail: caixa de entrada, envio de mensagens, respostas, encaminhamentos e gerenciamento de anexos, tudo integrado às configurações SMTP existentes e com controle de permissões por usuário.

## 2. Funcionalidades Principais

### 2.1 Papéis de Usuário

| Papel | Método de Acesso | Permissões Principais |
|-------|------------------|----------------------|
| Usuário com Permissão E-mail | Configurado em Configurações → Usuários | Pode acessar, enviar, receber e gerenciar e-mails |
| Usuário sem Permissão | Usuário padrão | Não pode acessar a aba E-mail |

### 2.2 Módulos de Funcionalidade

O sistema de e-mail consiste nas seguintes páginas principais:

1. **Página Principal (Caixa de Entrada)**: listagem de e-mails recebidos, campo de busca, filtros rápidos
2. **Modal de Composição**: formulário para envio de novos e-mails com campos Para, CC, CCO, assunto, corpo e anexos
3. **Modal de Visualização**: exibição completa do conteúdo de e-mails selecionados
4. **Modal de Resposta/Encaminhamento**: formulário pré-preenchido para responder ou encaminhar mensagens

### 2.3 Detalhes das Páginas

| Página | Módulo | Descrição da Funcionalidade |
|--------|--------|-----------------------------|
| Caixa de Entrada | Lista de E-mails | Exibir e-mails em tabela com colunas: Remetente, Assunto, Data/Hora, Ações. Suporte a paginação e ordenação |
| Caixa de Entrada | Campo de Busca | Buscar por remetente, assunto ou data com filtro em tempo real |
| Caixa de Entrada | Filtros Rápidos | Botões para filtrar: Hoje, Últimos 7 dias, Não lidos |
| Caixa de Entrada | Ações por E-mail | Botões: Abrir, Responder, Encaminhar, Excluir com confirmação |
| Modal Composição | Formulário de Envio | Campos: Para (obrigatório), CC, CCO, Assunto, Corpo (editor de texto), Anexar Arquivo |
| Modal Composição | Validação e Envio | Validar campos obrigatórios, usar configuração SMTP, feedback de sucesso/erro |
| Modal Visualização | Conteúdo Completo | Exibir remetente, destinatários, assunto, data, corpo e anexos do e-mail |
| Modal Resposta | Formulário Pré-preenchido | Auto-preencher destinatário e assunto com "Re:" ou "Fwd:" |

## 3. Fluxo Principal de Uso

### Fluxo do Usuário com Permissão

1. **Acesso à Aba E-mail** → Sistema verifica permissões → Carrega caixa de entrada
2. **Visualizar E-mails** → Aplicar filtros → Buscar mensagens → Selecionar e-mail → Abrir modal de visualização
3. **Enviar Novo E-mail** → Clicar "Novo E-mail" → Preencher formulário → Anexar arquivos (opcional) → Enviar
4. **Responder E-mail** → Selecionar e-mail → Clicar "Responder" → Editar resposta → Enviar
5. **Gerenciar E-mails** → Encaminhar ou Excluir mensagens conforme necessário

```mermaid
graph TD
    A[Aba E-mail] --> B{Usuário tem permissão?}
    B -->|Não| C[Acesso Negado]
    B -->|Sim| D[Caixa de Entrada]
    D