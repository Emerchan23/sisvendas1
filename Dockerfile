# Usar imagem Node.js oficial com Debian (melhor compatibilidade)
FROM node:18-slim

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema necessárias
RUN apt-get update && apt-get install -y \
    sqlite3 \
    python3 \
    python3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copiar arquivos essenciais primeiro
COPY package*.json postinstall.js auto-install-types.js ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Fazer build de produção do Next.js
RUN npm run build

# Criar diretório de dados e definir permissões
RUN mkdir -p /app/data /data
RUN chmod -R 755 /app/data
RUN chmod -R 777 /data

# Executar instalação automática
RUN node install.js || echo "Install script completed"

# Expor porta
EXPOSE 3145

# Definir variável de ambiente para o banco de dados (apontando para volume externo)
ENV DB_PATH="/data/erp.sqlite"

# Definir outras variáveis de ambiente
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3145

# Comando para iniciar aplicação
CMD ["node", "server.js"]
