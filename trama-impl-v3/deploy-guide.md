# TRAMA-APP — Guia de Deploy

**Stack:** Next.js 14 · PostgreSQL · Prisma · Docker · Nginx  
**Modos:** Self-hosted (recomendado) · Vercel · VPS manual  
**Audiência:** Pesquisadores com acesso a servidor próprio ou instituição

---

## Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Setup local de desenvolvimento](#2-setup-local-de-desenvolvimento)
3. [Deploy Self-Hosted com Docker](#3-deploy-self-hosted-com-docker)
4. [Deploy em VPS manual (Ubuntu 24.04)](#4-deploy-em-vps-manual-ubuntu-2404)
5. [Deploy na Vercel (cloud, mais simples)](#5-deploy-na-vercel-cloud-mais-simples)
6. [Variáveis de Ambiente](#6-variáveis-de-ambiente)
7. [Banco de Dados — Prisma Migrations](#7-banco-de-dados--prisma-migrations)
8. [Configuração do Nginx](#8-configuração-do-nginx)
9. [SSL com Let's Encrypt](#9-ssl-com-lets-encrypt)
10. [Backups do PostgreSQL](#10-backups-do-postgresql)
11. [Atualizações](#11-atualizações)
12. [Troubleshooting](#12-troubleshooting)
13. [Checklist de Produção](#13-checklist-de-produção)

---

## 1. Pré-requisitos

### Máquina local

```bash
# Verificar versões mínimas
node --version    # >= 18.17.0
npm --version     # >= 9.0.0
docker --version  # >= 24.0 (para deploy com Docker)
git --version     # qualquer versão recente
```

### Servidor (para self-hosted)

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| CPU | 1 vCPU | 2 vCPUs |
| RAM | 1 GB | 2 GB |
| Armazenamento | 20 GB SSD | 50 GB SSD |
| OS | Ubuntu 22.04+ | Ubuntu 24.04 LTS |
| Portas | 80, 443 abertas | + 22 (SSH) |

### Conta no GitHub (para clonar)

```bash
git clone https://github.com/hdmabuse/trama-app.git
cd trama-app
```

---

## 2. Setup Local de Desenvolvimento

### 2.1 Instalar dependências

```bash
npm install
```

### 2.2 Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com os valores necessários (ver [Seção 6](#6-variáveis-de-ambiente)).

### 2.3 Subir PostgreSQL local com Docker

```bash
# Sobe apenas o banco de dados
docker run -d \
  --name trama-db-dev \
  -e POSTGRES_DB=trama_dev \
  -e POSTGRES_USER=trama \
  -e POSTGRES_PASSWORD=troca_essa_senha \
  -p 5432:5432 \
  postgres:15-alpine

# Verificar se está rodando
docker ps | grep trama-db-dev
```

### 2.4 Rodar migrations do Prisma

```bash
npx prisma migrate dev
npx prisma generate
```

### 2.5 (Opcional) Popular com dados de exemplo

```bash
npx prisma db seed
```

### 2.6 Iniciar servidor de desenvolvimento

```bash
npm run dev
# → http://localhost:3000
```

### 2.7 Verificar saúde da aplicação

```bash
curl http://localhost:3000/api/health
# Esperado: {"status":"ok","db":"connected"}
```

---

## 3. Deploy Self-Hosted com Docker

Esta é a abordagem recomendada para pesquisadores que querem manter **soberania total dos dados** — especialmente em pesquisas com populações vulneráveis.

### 3.1 Estrutura Docker Compose

Crie o arquivo `docker-compose.yml` na raiz do projeto:

```yaml
version: '3.9'

services:

  # ─── Banco de dados ──────────────────────────────────────────────
  db:
    image: postgres:15-alpine
    container_name: trama-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-trama_prod}
      POSTGRES_USER: ${POSTGRES_USER:-trama}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - trama_db_data:/var/lib/postgresql/data
    networks:
      - trama-internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-trama}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ─── Aplicação Next.js ───────────────────────────────────────────
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
    container_name: trama-app
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-trama}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB:-trama_prod}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXT_PUBLIC_APP_URL}
      NODE_ENV: production
    depends_on:
      db:
        condition: service_healthy
    networks:
      - trama-internal
      - trama-external
    ports:
      - "3000:3000"

  # ─── Nginx reverse proxy ─────────────────────────────────────────
  nginx:
    image: nginx:alpine
    container_name: trama-nginx
    restart: unless-stopped
    volumes:
      - ./nginx/trama.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /var/www/certbot:/var/www/certbot:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - app
    networks:
      - trama-external

volumes:
  trama_db_data:

networks:
  trama-internal:
    internal: true
  trama-external:
```

### 3.2 Dockerfile da aplicação

Crie `Dockerfile` na raiz:

```dockerfile
# Estágio 1: Dependências
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Estágio 2: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate
RUN npm run build

# Estágio 3: Runtime (imagem mínima)
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Usuário não-root por segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Rodar migrations antes de iniciar (script de entrypoint)
COPY --from=builder /app/scripts/docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
```

### 3.3 Script de entrypoint

Crie `scripts/docker-entrypoint.sh`:

```bash
#!/bin/sh
set -e

echo "Rodando migrations do Prisma..."
npx prisma migrate deploy

echo "Iniciando servidor Next.js..."
exec node server.js
```

### 3.4 Arquivo .env de produção

```bash
# .env.production (NÃO versionar este arquivo)
cp .env.example .env.production
```

Edite `.env.production`:

```bash
# Banco de dados
POSTGRES_DB=trama_prod
POSTGRES_USER=trama
POSTGRES_PASSWORD=SENHA_FORTE_AQUI_MIN_32_CHARS

# Autenticação
NEXTAUTH_SECRET=CHAVE_ALEATORIA_MIN_32_CHARS
NEXTAUTH_URL=https://seu-dominio.com.br

# App
NEXT_PUBLIC_APP_URL=https://seu-dominio.com.br
NODE_ENV=production

# Analytics (opcional)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
```

> **Como gerar segredos fortes:**
> ```bash
> openssl rand -base64 32
> ```

### 3.5 Fazer o build e subir

```bash
# Build da imagem
docker compose --env-file .env.production build

# Subir todos os serviços
docker compose --env-file .env.production up -d

# Verificar logs
docker compose logs -f app
```

### 3.6 Verificar se está rodando

```bash
# Health check interno
docker exec trama-app curl -s http://localhost:3000/api/health

# Health check externo (após configurar Nginx)
curl https://seu-dominio.com.br/api/health
```

---

## 4. Deploy em VPS Manual (Ubuntu 24.04)

Para quem prefere controle total sem Docker.

### 4.1 Preparar o servidor

```bash
# Conectar no servidor
ssh usuario@IP_DO_SERVIDOR

# Atualizar o sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18 via NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Instalar Nginx
sudo apt install -y nginx

# Instalar PM2 (gerenciador de processos Node.js)
npm install -g pm2
```

### 4.2 Configurar PostgreSQL

```bash
sudo -u postgres psql << 'SQL'
CREATE DATABASE trama_prod;
CREATE USER trama WITH ENCRYPTED PASSWORD 'SENHA_FORTE_AQUI';
GRANT ALL PRIVILEGES ON DATABASE trama_prod TO trama;
ALTER DATABASE trama_prod OWNER TO trama;
SQL
```

### 4.3 Clonar e configurar o projeto

```bash
cd /var/www
sudo git clone https://github.com/hdmabuse/trama-app.git trama
sudo chown -R $USER:$USER trama
cd trama

# Instalar dependências (apenas produção)
npm ci --only=production

# Copiar e editar variáveis
cp .env.example .env.production
nano .env.production  # Editar valores
```

### 4.4 Build da aplicação

```bash
npm run build
```

### 4.5 Rodar migrations

```bash
NODE_ENV=production npx prisma migrate deploy
```

### 4.6 Configurar PM2

Crie `ecosystem.config.js`:

```js
module.exports = {
  apps: [{
    name: 'trama',
    script: '.next/standalone/server.js',
    instances: 'max',  // usa todos os CPUs
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
  }],
}
```

```bash
# Iniciar com PM2
pm2 start ecosystem.config.js --env production

# Salvar para reiniciar automático no boot
pm2 save
pm2 startup
# (seguir instrução que o PM2 imprime)
```

---

## 5. Deploy na Vercel (cloud, mais simples)

> **Aviso:** Dados serão armazenados na infraestrutura da Vercel (EUA).  
> Não recomendado para pesquisas com dados sensíveis ou populações vulneráveis.  
> Para soberania de dados, use as opções self-hosted acima.

### 5.1 Preparar banco de dados externo

Opções de banco gratuito compatíveis:
- [Supabase](https://supabase.com) — PostgreSQL gerenciado, plano free
- [Neon](https://neon.tech) — PostgreSQL serverless, plano free
- [Railway](https://railway.app) — $5/mês, mais fácil

```bash
# No painel do provedor: criar banco PostgreSQL
# Copiar a connection string: postgresql://user:pass@host:port/db
```

### 5.2 Deploy na Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel

# Seguir o wizard interativo:
# - Confirmar projeto
# - Link ao repositório GitHub (recomendado)
# - Adicionar variáveis de ambiente quando solicitado
```

### 5.3 Adicionar variáveis no painel Vercel

Em `vercel.com → projeto → Settings → Environment Variables`:

```
DATABASE_URL        postgresql://...
NEXTAUTH_SECRET     (gerar com openssl rand -base64 32)
NEXTAUTH_URL        https://seu-projeto.vercel.app
NODE_ENV            production
```

### 5.4 Rodar migrations na Vercel

```bash
# Rodar localmente apontando para o banco de produção
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

---

## 6. Variáveis de Ambiente

### Referência completa

```bash
# ─── Obrigatórias ────────────────────────────────────────────────────────────

# URL de conexão com PostgreSQL
DATABASE_URL="postgresql://USER:SENHA@HOST:PORT/DB_NAME"

# Segredo para JWT do NextAuth (min 32 chars, aleatório)
NEXTAUTH_SECRET="sua_chave_secreta_aqui"

# URL base da aplicação (sem barra final)
NEXTAUTH_URL="https://seu-dominio.com.br"

# URL pública (mesma do NEXTAUTH_URL na maioria dos casos)
NEXT_PUBLIC_APP_URL="https://seu-dominio.com.br"

# Ambiente
NODE_ENV="production"

# ─── PostgreSQL (apenas para Docker Compose) ─────────────────────────────────
POSTGRES_DB="trama_prod"
POSTGRES_USER="trama"
POSTGRES_PASSWORD="senha_forte_aqui"

# ─── Opcionais ───────────────────────────────────────────────────────────────

# Provedor OAuth (Google)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Analytics PostHog (self-hosted ou cloud)
NEXT_PUBLIC_POSTHOG_KEY=""
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"

# Upload de arquivos (S3 ou compatível — Minio, Backblaze, etc.)
S3_ENDPOINT=""
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""
S3_BUCKET_NAME="trama-uploads"

# Email para notificações (opcional)
EMAIL_SERVER_HOST=""
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER=""
EMAIL_SERVER_PASSWORD=""
EMAIL_FROM="noreply@seu-dominio.com.br"
```

### Verificar variáveis antes do deploy

```bash
# Script de verificação
node -e "
const required = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_APP_URL',
]
const missing = required.filter(k => !process.env[k])
if (missing.length) {
  console.error('Variáveis faltando:', missing.join(', '))
  process.exit(1)
}
console.log('Todas as variáveis obrigatórias estão configuradas.')
"
```

---

## 7. Banco de Dados — Prisma Migrations

### Fluxo de desenvolvimento

```bash
# 1. Criar nova migration após alterar schema.prisma
npx prisma migrate dev --name nome_da_migration

# Exemplos de nomes descritivos:
# npx prisma migrate dev --name add_user_onboarding
# npx prisma migrate dev --name add_project_templates
# npx prisma migrate dev --name add_theme_statistics

# 2. Gerar cliente Prisma atualizado
npx prisma generate

# 3. Visualizar schema atual
npx prisma studio
```

### Fluxo de produção

```bash
# Aplicar migrations pendentes (seguro para produção)
npx prisma migrate deploy

# Nunca usar em produção:
# npx prisma migrate reset   ← APAGA TODOS OS DADOS
# npx prisma migrate dev     ← apenas desenvolvimento
```

### Migrations necessárias para os Épicos 1 e 2

```sql
-- Epic 1: A/B testing
-- migration: add_hero_variant_tracking
CREATE TABLE IF NOT EXISTS "AbTestEvent" (
  "id"        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "variant"   TEXT NOT NULL CHECK (variant IN ('A', 'B')),
  "event"     TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON "AbTestEvent" ("variant", "event");
CREATE INDEX ON "AbTestEvent" ("createdAt");

-- Epic 2: Rastrear cliques no artigo
-- Nota: pode usar PostHog — não precisa de tabela no banco
-- Incluído apenas se não houver PostHog
CREATE TABLE IF NOT EXISTS "ArticleEvent" (
  "id"       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "type"     TEXT NOT NULL,  -- 'viewed', 'progress_50', 'completed', 'cta_clicked'
  "path"     TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);
```

Adicionar ao schema do Prisma:

```prisma
// prisma/schema.prisma

model AbTestEvent {
  id        String   @id @default(uuid()) @db.Uuid
  variant   String
  event     String
  sessionId String
  createdAt DateTime @default(now())

  @@index([variant, event])
  @@index([createdAt])
}
```

---

## 8. Configuração do Nginx

Crie `nginx/trama.conf`:

```nginx
# Redirecionar HTTP → HTTPS
server {
    listen 80;
    server_name seu-dominio.com.br www.seu-dominio.com.br;

    # Desafio Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name seu-dominio.com.br www.seu-dominio.com.br;

    # Certificados SSL (gerados na Seção 9)
    ssl_certificate     /etc/letsencrypt/live/seu-dominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com.br/privkey.pem;

    # Configurações SSL modernas
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; media-src 'self';" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    gzip_min_length 1000;

    # Proxy para Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout para uploads grandes
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
        client_max_body_size 50M;
    }

    # Cache de assets estáticos
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Health check (sem logs)
    location /api/health {
        proxy_pass http://localhost:3000;
        access_log off;
    }
}
```

```bash
# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

---

## 9. SSL com Let's Encrypt

### Para deploy Docker

```bash
# Instalar Certbot
sudo apt install -y certbot

# Gerar certificado (parar Nginx temporariamente)
docker compose stop nginx

sudo certbot certonly \
  --standalone \
  -d seu-dominio.com.br \
  -d www.seu-dominio.com.br \
  --email seu@email.com \
  --agree-tos \
  --non-interactive

# Reiniciar Nginx
docker compose start nginx
```

### Para VPS manual

```bash
sudo certbot --nginx \
  -d seu-dominio.com.br \
  -d www.seu-dominio.com.br \
  --email seu@email.com \
  --agree-tos \
  --non-interactive

# Renovação automática (Certbot instala automaticamente)
# Verificar cron:
sudo systemctl status certbot.timer
```

### Verificar validade

```bash
sudo certbot certificates
# Exibe: domínio, data de expiração, caminho do certificado
```

---

## 10. Backups do PostgreSQL

### Backup manual

```bash
# Para Docker
docker exec trama-db pg_dump \
  -U trama \
  -d trama_prod \
  --format=custom \
  --compress=9 \
  > backup_$(date +%Y%m%d_%H%M%S).pgdump

# Para VPS manual
pg_dump \
  -U trama \
  -d trama_prod \
  --format=custom \
  --compress=9 \
  > backup_$(date +%Y%m%d_%H%M%S).pgdump
```

### Backup automático com cron

```bash
# Editar crontab
crontab -e

# Adicionar: backup às 3h da manhã, manter últimos 7 dias
0 3 * * * docker exec trama-db pg_dump -U trama -d trama_prod --format=custom | gzip > /backups/trama_$(date +\%Y\%m\%d).pgdump.gz && find /backups -name "*.pgdump.gz" -mtime +7 -delete
```

### Restaurar backup

```bash
# Parar aplicação
docker compose stop app

# Restaurar
docker exec -i trama-db pg_restore \
  -U trama \
  -d trama_prod \
  --clean \
  --if-exists \
  < backup.pgdump

# Reiniciar
docker compose start app
```

---

## 11. Atualizações

### Processo de atualização segura

```bash
# 1. Fazer backup antes de qualquer atualização
docker exec trama-db pg_dump -U trama -d trama_prod --format=custom > backup_pre_update.pgdump

# 2. Puxar novas mudanças
git pull origin main

# 3. Verificar se há novas migrations
git log --oneline -5 prisma/migrations/

# 4. Build da nova imagem
docker compose --env-file .env.production build app

# 5. Subir nova versão (com zero-downtime se usando múltiplas instâncias)
docker compose --env-file .env.production up -d --no-deps app

# 6. Verificar saúde
docker compose logs --tail=50 app
curl https://seu-dominio.com.br/api/health
```

---

## 12. Troubleshooting

### Aplicação não inicia

```bash
# Ver logs completos
docker compose logs app

# Problemas comuns:
# 1. DATABASE_URL incorreta
echo $DATABASE_URL  # verificar formato

# 2. Migrations não rodaram
docker exec trama-app npx prisma migrate status

# 3. Porta 3000 em uso
sudo lsof -i :3000
```

### Banco de dados não conecta

```bash
# Testar conexão diretamente
docker exec -it trama-db psql -U trama -d trama_prod -c '\dt'

# Verificar se container está rodando
docker inspect trama-db | grep Status

# Ver logs do banco
docker compose logs db
```

### Nginx retorna 502 Bad Gateway

```bash
# Verificar se Next.js está rodando
curl http://localhost:3000/api/health

# Ver logs do Nginx
sudo tail -n 50 /var/log/nginx/error.log

# Verificar upstream no nginx.conf
grep "proxy_pass" nginx/trama.conf
```

### Migrations falhando em produção

```bash
# Ver status detalhado
npx prisma migrate status

# Se migration travada (apenas em emergências):
npx prisma migrate resolve --applied NOME_DA_MIGRATION

# Ver histórico de migrations
npx prisma migrate history
```

### Certificado SSL expirado

```bash
# Renovar manualmente
sudo certbot renew --force-renewal

# Recarregar Nginx
docker compose restart nginx
# ou
sudo systemctl reload nginx
```

---

## 13. Checklist de Produção

Execute este checklist antes de colocar o TRAMA em produção com dados de pesquisa reais.

### Segurança

- [ ] `NEXTAUTH_SECRET` tem pelo menos 32 caracteres aleatórios
- [ ] `POSTGRES_PASSWORD` tem pelo menos 20 caracteres aleatórios
- [ ] Nenhum segredo está commitado no git (verificar com `git log --all -p | grep -i password`)
- [ ] `.env.production` está no `.gitignore`
- [ ] SSH usa autenticação por chave (não senha)
- [ ] Firewall permite apenas portas 22, 80, 443
- [ ] Headers de segurança configurados no Nginx
- [ ] CSP configurado e testado

```bash
# Verificar segredos no git
git log --all -p | grep -E "(password|secret|key)" | head -20
```

### Banco de dados

- [ ] Migrations aplicadas com sucesso
- [ ] Backup automático configurado (cron)
- [ ] Backup manual testado e restauração verificada
- [ ] Usuário `trama` tem apenas permissões necessárias (não é superuser)

### SSL e Rede

- [ ] HTTPS funcionando (`https://seu-dominio.com.br`)
- [ ] Redirecionamento HTTP → HTTPS ativo
- [ ] Certificado SSL válido por mais de 30 dias
- [ ] Renovação automática configurada

```bash
# Testar SSL
curl -I https://seu-dominio.com.br
# Esperado: HTTP/2 200
```

### Aplicação

- [ ] `/api/health` retorna `{"status":"ok","db":"connected"}`
- [ ] Cadastro de usuário funciona
- [ ] Login/logout funciona
- [ ] Upload de documento funciona
- [ ] Codificação funciona
- [ ] Exportação PDF funciona
- [ ] Landing page carrega sem erros de console

### Performance

- [ ] Lighthouse score ≥ 80 em Performance
- [ ] Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1

```bash
# Teste de performance
npx lighthouse https://seu-dominio.com.br --output=json --output-path=lighthouse.json
```

### Monitoramento (opcional mas recomendado)

- [ ] PostHog ou equivalente para analytics
- [ ] Sentry para error tracking
- [ ] Uptime monitoring (UptimeRobot, Better Uptime)

---

## Configuração Final: Artigo na `/epistemologia`

Para que a página `/epistemologia` funcione com o artigo completo:

```bash
# Copiar o artigo para o diretório público
mkdir -p public/content
cp codificar-e-interpretar.md public/content/

# Verificar
ls public/content/
# codificar-e-interpretar.md
```

O arquivo deve estar em `public/content/codificar-e-interpretar.md`.  
O componente `ArticleContent.tsx` lê esse arquivo no server-side.

---

*CESAR School / Instituto Fab Lab Rec — Recife, PE — Abril 2026*  
*github.com/hdmabuse/trama-app*
