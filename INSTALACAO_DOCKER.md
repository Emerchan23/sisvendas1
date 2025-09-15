# 🐳 Instalação Limpa ERP-BR com Docker Desktop

Este guia mostra como fazer uma instalação completamente limpa do ERP-BR usando GitHub e Docker Desktop.

## 📋 Pré-requisitos

- **Docker Desktop** instalado e funcionando
- **Git** instalado (opcional, pode usar download direto)
- Conexão com internet

## 🚀 Método 1: Usando Git Clone (Recomendado)

### Passo 1: Clonar o Repositório
```bash
git clone https://github.com/Emerchan23/finantest.git
cd finantest
```

### Passo 2: Executar com Docker Compose
```bash
docker-compose up --build
```

### Passo 3: Acessar a Aplicação
Aguarde alguns minutos para o build e inicialização, depois acesse:
- **URL:** http://localhost:3145
- **API Health Check:** http://localhost:3145/api/health

## 🚀 Método 2: Download Direto do GitHub

### Passo 1: Baixar o Código
1. Acesse: https://github.com/Emerchan23/finantest
2. Clique em **"Code" > "Download ZIP"**
3. Extraia o arquivo ZIP em uma pasta
4. Abra o terminal na pasta extraída

### Passo 2: Executar com Docker Compose
```bash
docker-compose up --build
```

## 🛠️ Comandos Úteis do Docker

### Parar a Aplicação
```bash
docker-compose down
```

### Reconstruir Completamente (Instalação Limpa)
```bash
docker-compose down --volumes --rmi all
docker-compose up --build
```

### Ver Logs da Aplicação
```bash
docker-compose logs -f app
```

### Executar Comandos Dentro do Container
```bash
docker-compose exec app sh
```

## 📁 Estrutura de Dados

O banco de dados SQLite será criado automaticamente em:
- **Host:** `../Banco de dados Aqui/erp.sqlite`
- **Container:** `/app/../Banco de dados Aqui/erp.sqlite`

Os dados persistem mesmo quando o container é reiniciado.

## 🔧 Configurações Importantes

### Portas
- **Aplicação:** 3145 (host) → 3000 (container)
- **Acesso:** http://localhost:3145

### Variáveis de Ambiente
- `NODE_ENV=development`
- `DB_PATH=../Banco de dados Aqui/erp.sqlite`
- `PORT=3000`
- `NEXT_TELEMETRY_DISABLED=1`

## 🩺 Health Check

O Docker Compose inclui um health check automático que verifica:
- **Endpoint:** `/api/health`
- **Intervalo:** 30 segundos
- **Timeout:** 10 segundos
- **Tentativas:** 3

## 🐛 Solução de Problemas

### Problema: Porta 3145 já está em uso
```bash
# Verificar o que está usando a porta
netstat -ano | findstr :3145

# Parar processo se necessário
taskkill /PID <PID_NUMBER> /F
```

### Problema: Erro de permissão no banco de dados
```bash
# Recriar com volumes limpos
docker-compose down --volumes
docker-compose up --build
```

### Problema: Build falha
```bash
# Limpar cache do Docker
docker system prune -a
docker-compose up --build --no-cache
```

### Problema: Aplicação não inicia
```bash
# Ver logs detalhados
docker-compose logs -f app

# Verificar status dos containers
docker-compose ps
```

## 📊 Verificação da Instalação

Após a instalação, verifique se tudo está funcionando:

1. **Health Check:** http://localhost:3145/api/health
   - Deve retornar: `{"ok": true, "status": "healthy"}`

2. **Dashboard:** http://localhost:3145
   - Deve carregar a interface principal

3. **API Endpoints:**
   - http://localhost:3145/api/empresas
   - http://localhost:3145/api/clientes
   - http://localhost:3145/api/produtos

## 🔄 Atualizações

Para atualizar para a versão mais recente:

```bash
# Parar aplicação
docker-compose down

# Atualizar código (se usando git)
git pull origin main

# Reconstruir e iniciar
docker-compose up --build
```

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs: `docker-compose logs -f app`
2. Confirme que o Docker Desktop está rodando
3. Verifique se a porta 3145 está livre
4. Tente uma instalação limpa removendo volumes

---

**✅ Instalação Concluída!**

Sua aplicação ERP-BR está rodando em: **http://localhost:3145**