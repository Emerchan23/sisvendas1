# Use Node.js 18 Alpine como base
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Construir a aplicação Next.js
RUN npm run build

# Criar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Criar diretório para dados e definir permissões
RUN mkdir -p /data && chown nextjs:nodejs /data

# Mudar para usuário não-root
USER nextjs

# Expor porta
EXPOSE 3145

# Definir variáveis de ambiente
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3145

# Comando para iniciar a aplicação
CMD ["npm", "start"]
