# Multi-stage build otimizado para resolver problemas de dependências

# Stage 1: Build
FROM node:18-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema necessárias
RUN apk add --no-cache libc6-compat python3 make g++

# Copiar apenas package.json (sem package-lock.json para evitar conflitos)
COPY package.json ./

# Limpar cache do npm e instalar dependências com logs detalhados
RUN echo "Limpando cache do npm..." && \
    npm cache clean --force && \
    echo "Instalando dependências..." && \
    npm install --verbose --no-package-lock && \
    echo "Dependências instaladas com sucesso!"

# Copiar código fonte
COPY . .

# Construir a aplicação Next.js
RUN echo "Iniciando build da aplicação..." && \
    npm run build && \
    echo "Build concluído com sucesso!"

# Stage 2: Production
FROM node:18-alpine AS runner

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache libc6-compat

# Criar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar package.json
COPY package.json ./

# Instalar apenas dependências de produção com estratégia robusta
RUN echo "Instalando dependências de produção..." && \
    npm cache clean --force && \
    npm install --only=production --no-package-lock --verbose && \
    echo "Removendo dependências desnecessárias..." && \
    npm prune --production && \
    npm cache clean --force && \
    echo "Dependências de produção instaladas!"

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
