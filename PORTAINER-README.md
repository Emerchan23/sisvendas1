# 🐳 Sistema ERP - Configuração para Portainer

## 📋 Visão Geral
O sistema ERP foi configurado para funcionar perfeitamente com o Portainer, incluindo labels, networks customizadas, healthchecks e monitoramento de recursos.

## 🚀 Como Usar no Portainer

### 1. Importar Stack no Portainer
1. Acesse seu Portainer (geralmente em `http://localhost:9000`)
2. Vá em **Stacks** → **Add Stack**
3. Escolha **Upload** e selecione o arquivo `docker-compose.yml`
4. Ou copie e cole o conteúdo do arquivo na área de texto
5. Nomeie a stack como `erp-gestao-vendas`
6. Clique em **Deploy the stack**

### 2. Configurações Incluídas

#### 🏷️ Labels para Portainer
- `com.portainer.stack.name=erp-gestao-vendas`
- `com.portainer.service.description=Sistema ERP de Gestão de Vendas`
- `com.portainer.service.version=1.0.0`
- `app.name=ERP Gestão Vendas`

#### 🌐 Network Customizada
- **Nome**: `erp-network`
- **Tipo**: Bridge
- **Descrição**: Rede isolada para o sistema ERP

#### 💾 Volume Persistente
- **Nome**: `erp-data`
- **Tipo**: Bind mount
- **Origem**: `../Banco de dados Aqui`
- **Destino**: `/data` (dentro do container)

#### 🔍 Healthcheck Avançado
- **Teste**: Verificação HTTP na rota `/api/health`
- **Intervalo**: 30 segundos
- **Timeout**: 10 segundos
- **Tentativas**: 5
- **Período inicial**: 60 segundos

#### 📊 Monitoramento de Recursos
- **Limite de Memória**: 512MB
- **Limite de CPU**: 1.0 core
- **Logs**: Rotação automática (máx 10MB, 3 arquivos)

## 🎯 Funcionalidades no Portainer

### Dashboard
- Visualização do status do container
- Gráficos de uso de CPU e memória
- Logs em tempo real
- Estatísticas de rede

### Monitoramento
- Status de saúde (healthcheck)
- Alertas de falha
- Histórico de reinicializações
- Métricas de performance

### Gerenciamento
- Start/Stop/Restart do container
- Visualização de logs
- Acesso ao terminal do container
- Backup e restore

## 🔧 Comandos Úteis

### Via Portainer Interface
- **Logs**: Containers → erp-gestao-vendas → Logs
- **Terminal**: Containers → erp-gestao-vendas → Console
- **Stats**: Containers → erp-gestao-vendas → Stats

### Via CLI (se necessário)
```bash
# Ver status da stack
docker-compose ps

# Ver logs
docker-compose logs -f

# Parar a stack
docker-compose down

# Iniciar a stack
docker-compose up -d
```

## 🌐 Acesso ao Sistema
- **URL**: http://localhost:3145
- **Container**: erp-gestao-vendas
- **Network**: erp-network
- **Volume**: erp-data

## 📁 Estrutura de Arquivos
```
gestao vendas/
├── docker-compose.yml     # Configuração principal
├── Dockerfile            # Imagem do container
├── package.json          # Dependências Node.js
└── ../Banco de dados Aqui/  # Dados persistentes
    └── erp.sqlite        # Banco de dados principal
```

## ✅ Verificações de Saúde
O sistema inclui verificações automáticas:
- ✅ Conectividade HTTP
- ✅ Banco de dados acessível
- ✅ Serviços internos funcionando
- ✅ Backup automático ativo

## 🔒 Segurança
- Container isolado em network própria
- Volumes com permissões controladas
- Logs com rotação automática
- Healthcheck para detecção de falhas

## 📞 Suporte
Em caso de problemas:
1. Verifique os logs no Portainer
2. Confirme se o volume está montado corretamente
3. Teste a conectividade na porta 3145
4. Verifique o status do healthcheck

---
**Sistema ERP v1.0.0** - Configurado para Portainer 🐳