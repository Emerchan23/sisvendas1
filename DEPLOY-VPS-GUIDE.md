# 🚀 Guia de Deploy VPS/Portainer

Este guia explica como usar os arquivos Docker Compose alternativos para deploy em VPS Ubuntu com Portainer.

## 📁 Arquivos Disponíveis

### 1. `docker-compose.portainer.yml` (Recomendado)
**Uso**: Deploy simples no Portainer
- ✅ Volume Docker nomeado (resolve problema de bind mount)
- ✅ Healthcheck configurado
- ✅ Rede isolada
- ✅ Configuração mínima e estável

### 2. `docker-compose.vps.yml` (Avançado)
**Uso**: Deploy completo com Nginx
- ✅ Inclui proxy reverso Nginx (opcional)
- ✅ Inicialização automática do banco
- ✅ Configuração para produção
- ✅ Logs estruturados

## 🛠️ Como Usar no Portainer

### Método 1: Upload Direto
1. Acesse seu Portainer
2. Vá em **Stacks** → **Add Stack**
3. Escolha **Upload**
4. Selecione `docker-compose.portainer.yml`
5. Clique em **Deploy the stack**

### Método 2: Repository (GitHub)
1. Acesse **Stacks** → **Add Stack**
2. Escolha **Repository**
3. URL: `https://github.com/Emerchan23/sisvendas1.git`
4. Compose file path: `gestao vendas/docker-compose.portainer.yml`
5. Clique em **Deploy the stack**

## 🔧 Configurações VPS

### Preparar Diretórios (Opcional para VPS avançado)
```bash
# Criar diretório para dados (apenas se usar docker-compose.vps.yml)
sudo mkdir -p /opt/sisvendas/data
sudo chown -R 1000:1000 /opt/sisvendas/data
sudo chmod 755 /opt/sisvendas/data
```

### Variáveis de Ambiente
No Portainer, você pode adicionar estas variáveis:
```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3145
DB_PATH=/data/erp.sqlite
```

## 🌐 Acesso à Aplicação

Após o deploy:
- **URL**: `http://SEU_IP_VPS:3145`
- **Logs**: Disponíveis no Portainer → Containers → sisvendas_app
- **Status**: Healthcheck automático verifica se está funcionando

## 🔍 Troubleshooting

### Problema: "Permission denied for table"
**Solução**: O volume Docker resolve automaticamente as permissões

### Problema: "Port already in use"
**Solução**: Altere a porta no docker-compose:
```yaml
ports:
  - "3146:3145"  # Porta externa diferente
```

### Problema: "Database locked"
**Solução**: Reinicie o container no Portainer

## 📊 Monitoramento

### Verificar Status
```bash
# Via Docker CLI (se disponível)
docker ps
docker logs sisvendas_app

# Via Portainer
# Containers → sisvendas_app → Logs
```

### Backup do Banco
O banco fica no volume `sisvendas_database`:
```bash
# Backup manual
docker run --rm -v sisvendas_database:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz /data
```

## 🔄 Atualizações

### Via Portainer
1. Vá em **Stacks** → Sua Stack
2. Clique em **Editor**
3. Clique em **Update the stack**
4. Marque **Re-pull image and redeploy**

### Via GitHub (se usando Repository)
1. Faça push das alterações no GitHub
2. No Portainer: **Stacks** → **Pull and redeploy**

## ⚡ Comandos Úteis

```bash
# Deploy local
docker-compose -f docker-compose.portainer.yml up -d

# Deploy com build
docker-compose -f docker-compose.portainer.yml up --build -d

# Parar
docker-compose -f docker-compose.portainer.yml down

# Ver logs
docker-compose -f docker-compose.portainer.yml logs -f
```

## 🎯 Diferenças dos Arquivos Originais

| Recurso | Original | Portainer | VPS |
|---------|----------|-----------|-----|
| Bind Mount | ❌ Problemático | ✅ Volume Docker | ✅ Volume Docker |
| Healthcheck | ❌ Não | ✅ Sim | ✅ Sim |
| Nginx | ❌ Não | ❌ Não | ✅ Opcional |
| Rede Isolada | ❌ Não | ✅ Sim | ✅ Sim |
| Portainer Ready | ❌ Não | ✅ Sim | ✅ Sim |

---

**💡 Dica**: Use `docker-compose.portainer.yml` para deploys simples e `docker-compose.vps.yml` quando precisar de configurações avançadas.