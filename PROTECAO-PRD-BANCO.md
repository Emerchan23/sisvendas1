# 🚨 PROTEÇÃO CONTRA VIOLAÇÃO DO PRD - BANCO DE DADOS

## ⚠️ REGRA FUNDAMENTAL

**É ESTRITAMENTE PROIBIDO criar ou armazenar arquivos de banco de dados dentro da pasta `gestao vendas`!**

## 📍 Localização Correta dos Bancos

Todos os arquivos de banco de dados DEVEM estar em:
```
../Banco de dados Aqui/
```

## 🔍 Como Verificar Conformidade

Execute o comando de verificação:
```bash
npm run check-prd-compliance
```

Ou diretamente:
```bash
node check-no-db-violation.js
```

## 🚫 Arquivos Proibidos na Pasta `gestao vendas`

- `*.sqlite`
- `*.db` 
- `*.sqlite3`
- `*.database`
- Qualquer arquivo de banco na pasta `data/`

## ✅ Configuração Correta do Código

Todos os arquivos devem usar o caminho correto:
```javascript
const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
```

## 🛡️ Sistemas de Proteção Implementados

1. **Script de Verificação**: `check-no-db-violation.js`
2. **Comando NPM**: `npm run check-prd-compliance`
3. **Arquivo de Proteção**: `.gitignore-db-protection`
4. **Documentação**: Este arquivo

## 🚨 Em Caso de Violação

Se o script detectar violações:

1. **Mover** todos os arquivos de banco para `../Banco de dados Aqui/`
2. **Atualizar** código para usar o caminho correto
3. **Verificar** se não há código criando bancos locais
4. **Executar** novamente `npm run check-prd-compliance`

## 📋 Checklist de Conformidade

- [ ] Nenhum arquivo `.sqlite`, `.db`, `.sqlite3` na pasta `gestao vendas`
- [ ] Pasta `data/` contém apenas arquivos JSON
- [ ] Código usa caminho `../Banco de dados Aqui/erp.sqlite`
- [ ] Script de verificação passa sem erros

---

**LEMBRETE**: Esta regra é fundamental para a arquitetura do sistema e NUNCA deve ser violada!