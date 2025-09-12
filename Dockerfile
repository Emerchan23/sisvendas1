# Usar imagem Node.js oficial
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema necessárias para better-sqlite3
RUN apk add --no-cache sqlite python3 make g++ libc6-compat

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Criar diretório de dados e definir permissões
RUN mkdir -p /app/data /data
RUN chmod -R 755 /app/data
RUN chmod -R 777 /data

# Executar instalação automática
RUN node install.js || echo "Install script completed"

# Expor porta
EXPOSE 3000

# Definir variáveis de ambiente
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV DB_PATH="/data/erp.sqlite"
ENV PORT=3000

# Comando para iniciar aplicação
CMD ["node", "server.js"]
