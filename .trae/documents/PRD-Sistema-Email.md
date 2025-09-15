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

```

## 5. Correções de Bugs Críticos (Janeiro 2025)

### 5.1 Correção do Erro de Constraint NOT NULL - data_validade

**Problema Identificado:**
- Erro HTTP 500: "NOT NULL constraint failed: orcamentos.data_validade"
- Campo `data_validade` sendo enviado como `null` quando vazio no formulário
- Violação de constraint da tabela `orcamentos` no banco SQLite

**Análise Realizada:**
1. **Verificação do Schema**: Confirmado que a coluna `data_validade` possui constraint NOT NULL no banco
2. **Análise do Frontend**: Identificado que `dataValidade || null` estava sendo enviado quando campo vazio
3. **Rastreamento da API**: Confirmado que a API recebia valores `null` causando a violação

**Correções Implementadas:**

#### Frontend (components/orcamento-form.tsx):
```typescript
// Função para garantir data válida
const getValidDataValidade = () => {
  if (dataValidade) {
    return dataValidade
  }
  // Data padrão: 30 dias a partir de hoje
  const hoje = new Date()
  const dataDefault = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)
  return dataDefault.toISOString().split('T')[0]
}

// Substituição nos objetos dadosParaSalvar
data_validade: getValidDataValidade() // ao invés de dataValidade || null
```

#### Backend (app/api/orcamentos/[id]/route.ts):
```typescript
// Validação adicional na API
if (!body.data_validade || body.data_validade === null) {
  console.log('❌ Campo data_validade é obrigatório')
  return NextResponse.json(
    { error: 'Campo data_validade é obrigatório' },
    { status: 400 }
  )
}
```

**Resultado:**
- ✅ Eliminado erro de constraint NOT NULL
- ✅ Data de validade padrão de 30 dias quando não informada
- ✅ Validação robusta no frontend e backend

### 5.2 Investigação do Erro de E-mail SMTP

**Problema Reportado:**
- Erro interno do servidor ao enviar e-mail
- Falha na funcionalidade de envio de orçamentos por e-mail

**Análise Realizada:**
1. **Verificação das Configurações SMTP**: Confirmado que todas as configurações estão presentes:
   - Host SMTP: smtp.gmail.com ✅
   - Porta SMTP: 587 ✅
   - Usuário SMTP: configurado ✅
   - Senha SMTP: configurada ✅
   - E-mail remetente: configurado ✅

2. **Estrutura da API**: Verificado que a API `/api/email/send` possui:
   - Validação completa de campos obrigatórios
   - Tratamento de erros específicos (EAUTH, ECONNREFUSED, ETIMEDOUT)
   - Logs detalhados para debugging
   - Configuração correta do transporter Nodemailer

**Status:**
- ✅ Configurações SMTP validadas e corretas
- ✅ API de e-mail estruturada adequadamente
- ⚠️ Erro pode estar relacionado a credenciais ou conectividade específica

**Recomendações:**
1. Verificar se a senha de app do Gmail está atualizada
2. Confirmar que a autenticação de 2 fatores está habilitada
3. Testar conectividade SMTP manualmente
4. Verificar logs do servidor durante tentativas de envio

### 5.3 Melhorias de Robustez Implementadas

**Validações Adicionais:**
- Campo `data_validade` sempre recebe valor válido
- Logs detalhados para debugging de problemas
- Tratamento de erros mais específico

**Testes Realizados:**
- ✅ Lógica de data padrão funcionando (30 dias a partir de hoje)
- ✅ Configurações SMTP validadas no banco de dados
- ✅ Servidor de desenvolvimento executando sem erros

**Documentação Atualizada:**
- Correções documentadas no PRD
- Procedimentos de troubleshooting definidos
- Padrões de validação estabelecidosmermaid
graph TD
    A[Aba E-mail] --> B{Usuário tem permissão?}
    B -->|Não| C[Acesso Negado]
    B -->|Sim| D[Caixa de Entrada]
    D
```

## 4. Melhorias no Sistema de Notificações (Janeiro 2025)

### 4.1 Padronização de Mensagens de Erro

Foi realizada uma padronização completa do sistema de notificações em todas as abas do sistema para melhorar a experiência do usuário:

#### Mudanças Implementadas:

1. **Remoção de Imagens Vermelhas de Erro**: Eliminadas todas as notificações com `variant="destructive"` que exibiam imagens vermelhas intimidantes

2. **Substituição por Mensagens de Texto Claras**: Implementadas mensagens informativas com títulos descritivos e descrições explicativas

3. **Categorização de Erros**:
   - **Erros de Sistema**: Para falhas técnicas (ex: "Erro de Sistema: Falha no Carregamento")
   - **Erros de Validação**: Para campos obrigatórios ou dados inválidos (ex: "Erro de Validação: Campo Obrigatório")
   - **Erros de Dependência**: Para restrições de negócio (ex: "Erro de Validação: Cliente com Dependências")

#### Abas Corrigidas:
- ✅ Vendas
- ✅ Clientes  
- ✅ Fornecedores
- ✅ Produtos
- ✅ Orçamentos
- ✅ Acertos

#### Benefícios:
- Interface mais amigável e profissional
- Mensagens mais informativas para o usuário
- Redução da ansiedade causada por elementos visuais agressivos
- Melhor compreensão dos problemas e suas soluções

### 4.2 Padrão de Implementação

```typescript
// Antes (com imagem vermelha)
toast.error("Erro ao salvar")
// ou
toast({
  title: "Erro",
  description: "Falha na operação",
  variant: "destructive"
})

// Depois (mensagem clara)
toast({
  title: "Erro de Sistema: Falha no Salvamento",
  description: "Não foi possível salvar os dados. Tente novamente."
})
```