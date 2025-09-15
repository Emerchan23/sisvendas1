# 🔍 INVESTIGAÇÃO COMPLETA - Detalhes Internos

## 📋 Problema Identificado
- **Valor unitário** não está salvando
- **Detalhes internos** (link_ref e custo_ref) não estão salvando

## 🚀 INSTRUÇÕES PARA TESTE

### 1️⃣ Preparação
1. Abra o navegador em: **http://localhost:3145**
2. Navegue para a página de **Orçamentos**
3. Abra o **Console do Desenvolvedor** (F12 → Console)

### 2️⃣ Executar Script de Teste
1. **Cole o script** que foi copiado para a área de transferência no console
2. **Pressione Enter** para executar
3. Você verá mensagens como:
   ```
   🧪 TESTE COMPLETO - Detalhes Internos
   =====================================
   ```

### 3️⃣ Testar Detalhes Internos
1. **Crie um novo orçamento** ou **edite um existente**
2. **Adicione pelo menos 2 itens** na tabela
3. **Execute no console**:
   ```javascript
   window.testeDetalhes.preencherDetalhesInternos()
   ```
4. Isso irá:
   - Expandir automaticamente os "Detalhes internos"
   - Preencher campos de **Link ref** e **Custo ref**

### 4️⃣ Verificar Dados Antes de Salvar
1. **Execute no console**:
   ```javascript
   window.testeDetalhes.verificarDadosAntesSalvamento()
   ```
2. Verifique se os valores estão preenchidos corretamente

### 5️⃣ Salvar e Analisar
1. **Preencha os campos obrigatórios** (cliente, etc.)
2. **Clique em "Salvar Orçamento"**
3. **Execute no console**:
   ```javascript
   window.testeDetalhes.analisarRequisicoes()
   ```

## 🔍 O QUE OBSERVAR

### ✅ Comportamento Esperado
- Campos de detalhes internos devem ser preenchidos
- Requisição deve incluir `link_ref` e `custo_ref` nos itens
- Backend deve salvar os dados no banco

### ❌ Possíveis Problemas
1. **Frontend não captura dados**: Campos não aparecem na requisição
2. **Backend não processa**: Dados chegam mas não são salvos
3. **Erro de validação**: Dados são rejeitados

## 📊 ANÁLISE DOS LOGS

### Console do Navegador
Procure por:
- `📡 REQUISIÇÃO PARA API DE ORÇAMENTOS!`
- `📦 BODY DA REQUISIÇÃO:`
- `✅ DETALHES INTERNOS ENCONTRADOS NO ITEM!`
- `❌ DETALHES INTERNOS AUSENTES NO ITEM!`

### Terminal do Servidor
Procure por:
- `🔍 [BACKEND DEBUG]` - logs de depuração
- Erros de SQL ou validação
- Confirmação de salvamento dos itens

## 🛠️ FUNÇÕES DISPONÍVEIS

```javascript
// Analisar estado atual da página
window.testeDetalhes.analisarEstadoPagina()

// Preencher campos automaticamente
window.testeDetalhes.preencherDetalhesInternos()

// Verificar dados antes de salvar
window.testeDetalhes.verificarDadosAntesSalvamento()

// Ver requisições interceptadas
window.testeDetalhes.analisarRequisicoes()
```

## 📝 RELATÓRIO

Após executar os testes, anote:

1. **Os campos de detalhes internos aparecem?** ✅/❌
2. **Os valores são preenchidos corretamente?** ✅/❌
3. **Os dados aparecem na requisição HTTP?** ✅/❌
4. **O backend recebe os dados?** ✅/❌
5. **Os dados são salvos no banco?** ✅/❌

## 🎯 PRÓXIMOS PASSOS

Com base nos resultados, identificaremos:
- **Onde exatamente** está o problema
- **Qual componente** precisa ser corrigido
- **Como implementar** a solução definitiva

---

**🚨 IMPORTANTE**: Execute cada passo e observe os logs detalhadamente. Isso nos dará informações precisas para corrigir o problema definitivamente.