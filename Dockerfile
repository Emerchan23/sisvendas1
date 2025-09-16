# Dockerfile ultra-simplificado
FROM node:18

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências com flags de compatibilidade
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copiar código fonte
COPY . .

# Construir a aplicação
RUN npm run build

# Expor porta
EXPOSE 3145

# Definir variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3145

# Comando para iniciar
CMD ["npm", "start"]
