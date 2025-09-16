# Multi-stage build para otimizar tamanho da imagem

# Stage 1: Build
FROM node:18-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar todas as dependências (incluindo devDependencies para build)
RUN npm install

# Copiar código fonte
COPY . .

# Construir a aplicação Next.js
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS runner

# Definir diretório de trabalho
WORKDIR /app

# Criar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm install --production && npm cache clean --force

# Copiar arquivos buildados do stage anterior
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./next.config.js 2>/dev/null || true

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
