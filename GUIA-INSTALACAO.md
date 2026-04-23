# TRAMA — Guia de Instalação e Deploy

**Versão:** 1.0 · **Data:** Abril 2026 · **Status:** Pronto para uso local

---

## 1. Visão geral da arquitetura

O TRAMA é uma aplicação Next.js 14 (App Router) com PostgreSQL, executável em dois modos:

| Modo | Uso | Composição |
|------|-----|------------|
| **Local** | Desenvolvimento e testes | `docker-compose.yml` (só PostgreSQL) + `npm run dev` |
| **Produção** | Deploy em VPS | `docker-compose.prod.yml` (PostgreSQL + App containerizada) |

A transição entre os dois modos é direta: o mesmo código, o mesmo banco, o mesmo schema Prisma. A diferença é apenas como o processo Node.js é executado (dev server vs. container standalone).

### Stack

- **Runtime:** Node.js 20+
- **Framework:** Next.js 14 (App Router, Server Components)
- **Banco:** PostgreSQL 16 via Docker
- **ORM:** Prisma 6
- **Auth:** NextAuth.js 4 (credentials provider)
- **CSS:** Tailwind CSS 3
- **Linguagem:** TypeScript 5

### Estrutura de diretórios

```
trama/
├── docker-compose.yml          # PostgreSQL para dev local
├── docker-compose.prod.yml     # PostgreSQL + App para VPS
├── Dockerfile                  # Build de produção
├── .env.example                # Template de variáveis de ambiente
├── package.json
├── prisma/
│   ├── schema.prisma           # Modelo de dados
│   └── seed.ts                 # Dados de teste
└── src/
    ├── app/
    │   ├── layout.tsx           # Layout raiz
    │   ├── page.tsx             # Redirect → login ou dashboard
    │   ├── login/page.tsx       # Tela de login
    │   ├── dashboard/page.tsx   # Grid de projetos
    │   ├── projeto/[id]/page.tsx # Workspace de análise
    │   └── api/                 # Rotas de API
    │       ├── auth/[...nextauth]/route.ts
    │       ├── projetos/route.ts
    │       ├── projetos/[id]/route.ts
    │       ├── documentos/route.ts
    │       ├── codigos/route.ts
    │       └── codificacoes/route.ts
    ├── components/
    │   ├── Providers.tsx         # SessionProvider
    │   ├── Header.tsx            # Barra superior
    │   ├── Sidebar.tsx           # Navegação lateral
    │   ├── DashboardClient.tsx   # Cards de projetos
    │   └── Workspace.tsx         # Layout 3 colunas + codificação
    └── lib/
        ├── db.ts                # Singleton Prisma
        └── auth.ts              # Config NextAuth
```

---

## 2. Pré-requisitos

Antes de começar, instale na sua máquina:

### 2.1 Node.js 20+

```bash
# Verificar versão
node -v    # deve ser >= 20.0

# Se não tiver, instalar via nvm (recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

### 2.2 Docker e Docker Compose

```bash
# Verificar
docker --version          # >= 24.0
docker compose version    # >= 2.20

# Ubuntu 24.04 — instalar se necessário
sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER
# Fazer logout e login novamente para aplicar o grupo
```

### 2.3 Git (opcional mas recomendado)

```bash
sudo apt install -y git
```

---

## 3. Instalação local — passo a passo

### 3.1 Extrair o projeto

```bash
# Se recebeu como .zip
unzip trama.zip
cd trama

# Ou se clonou de um repositório
git clone <url-do-repo> trama
cd trama
```

### 3.2 Configurar variáveis de ambiente

```bash
cp .env.example .env
```

O arquivo `.env` já vem com valores padrão para desenvolvimento local. Você não precisa alterar nada para testar localmente.

Conteúdo do `.env`:

```
DATABASE_URL="postgresql://trama:trama_local_2026@localhost:5432/trama?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="troca-este-segredo-antes-do-deploy-2026"
```

### 3.3 Subir o PostgreSQL

```bash
docker compose up -d
```

Verificar se está rodando:

```bash
docker compose ps
# Deve mostrar trama-db como "running"

# Testar conexão
docker exec trama-db pg_isready -U trama
# Deve retornar "accepting connections"
```

### 3.4 Instalar dependências

```bash
npm install
```

### 3.5 Configurar o banco de dados

```bash
# Gerar o cliente Prisma + aplicar schema + popular com dados de teste
npm run setup
```

Este comando faz três coisas em sequência:

1. `prisma generate` — gera o cliente tipado
2. `prisma db push` — cria as tabelas no PostgreSQL
3. `tsx prisma/seed.ts` — insere dados de teste

Ao final, você verá:

```
Seed concluído com sucesso.
Login: pesquisador@trama.app.br / trama2026
```

### 3.6 Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Abrir no navegador: **http://localhost:3000**

Credenciais de teste:

| Campo | Valor |
|-------|-------|
| Email | `pesquisador@trama.app.br` |
| Senha | `trama2026` |

### 3.7 Verificar que tudo funciona

Após fazer login, você deve ver:

1. **Dashboard** com o projeto "Redesign App Mobile"
2. Clicar no projeto abre o **Workspace** com 3 colunas
3. O documento "Transcrição P01 — Maria" aparece na coluna da esquerda
4. Os 5 códigos de teste aparecem na coluna da direita
5. O trecho codificado aparece com highlight no texto

**Testar a codificação:**

1. No texto central, selecione um trecho com o mouse
2. O popup de codificação aparece
3. Escolha um código, opcionalmente adicione um memo
4. Clique "Aplicar"
5. O trecho fica destacado com a cor do código

---

## 4. Comandos úteis durante o desenvolvimento

```bash
# Servidor de desenvolvimento (com hot-reload)
npm run dev

# Resetar banco completamente (apaga e recria)
npm run db:reset

# Abrir interface visual do banco (Prisma Studio)
npm run db:studio
# Abre em http://localhost:5555

# Parar o PostgreSQL
docker compose down

# Parar e apagar dados do banco
docker compose down -v

# Ver logs do PostgreSQL
docker compose logs -f db
```

---

## 5. Fluxo de trabalho recomendado para desenvolvimento

```
1. docker compose up -d           ← sobe o banco
2. npm run dev                    ← sobe o app
3. ... desenvolver / testar ...
4. Ctrl+C                         ← para o app
5. docker compose down            ← para o banco
```

Para alterar o modelo de dados:

```
1. Editar prisma/schema.prisma
2. npm run db:push                ← aplica as mudanças
3. Reiniciar npm run dev se necessário
```

---

## 6. Preparação para deploy em VPS

### 6.1 Escolher um provedor

| Provedor | Plano recomendado | Custo mensal |
|----------|-------------------|--------------|
| DigitalOcean | Droplet Basic 1GB | $6/mês |
| Hetzner | CX22 (2vCPU/4GB) | €4,51/mês |
| Contabo | VPS S (4vCPU/8GB) | €5,99/mês |
| Oracle Cloud | Always Free ARM | $0/mês |

**Requisitos mínimos:** 1 vCPU, 1GB RAM, 25GB SSD, Ubuntu 24.04.

### 6.2 Preparar o servidor

Conectar via SSH:

```bash
ssh root@<IP_DO_SERVIDOR>
```

Instalar Docker:

```bash
apt update && apt upgrade -y
apt install -y docker.io docker-compose-v2 ufw

# Firewall
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable

# Usuário não-root (recomendado)
adduser trama
usermod -aG docker trama
su - trama
```

### 6.3 Enviar o código para o servidor

```bash
# Do seu computador local
scp -r trama/ trama@<IP>:~/trama

# Ou usando git
ssh trama@<IP>
git clone <url-do-repo> ~/trama
```

### 6.4 Configurar variáveis de produção

```bash
cd ~/trama
cp .env.example .env
nano .env
```

Alterar os valores:

```
DATABASE_URL="postgresql://trama:<SENHA_FORTE>@db:5432/trama?schema=public"
NEXTAUTH_URL="https://trama.app.br"
NEXTAUTH_SECRET="<gerar-com-openssl-rand-base64-32>"

DB_USER=trama
DB_PASSWORD=<MESMA_SENHA_FORTE>
DB_NAME=trama
```

Gerar um segredo forte:

```bash
openssl rand -base64 32
```

### 6.5 Build e deploy

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Verificar:

```bash
docker compose -f docker-compose.prod.yml ps
# Deve mostrar trama-db e trama-app como "running"

# Testar
curl http://localhost:3000
```

### 6.6 Configurar Nginx como reverse proxy (HTTPS)

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Criar configuração:

```bash
sudo nano /etc/nginx/sites-available/trama
```

Conteúdo:

```nginx
server {
    server_name trama.app.br;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 10M;
}
```

Ativar e obter certificado SSL:

```bash
sudo ln -s /etc/nginx/sites-available/trama /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL com Let's Encrypt
sudo certbot --nginx -d trama.app.br
```

### 6.7 Seed em produção (primeiro acesso)

```bash
docker exec -it trama-app sh -c "npx prisma db push && npx tsx prisma/seed.ts"
```

---

## 7. Manutenção em produção

### 7.1 Atualizar o código

```bash
cd ~/trama
git pull                                                  # ou scp dos novos arquivos
docker compose -f docker-compose.prod.yml up -d --build   # rebuild
```

### 7.2 Backup do banco

```bash
# Criar backup
docker exec trama-db pg_dump -U trama trama > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup_20260419.sql | docker exec -i trama-db psql -U trama trama
```

Automatizar com cron:

```bash
crontab -e
# Adicionar:
0 3 * * * docker exec trama-db pg_dump -U trama trama > /home/trama/backups/trama_$(date +\%Y\%m\%d).sql
```

### 7.3 Monitorar

```bash
# Logs da aplicação
docker compose -f docker-compose.prod.yml logs -f app

# Uso de disco
df -h

# Uso de memória
free -h
```

---

## 8. Troubleshooting

| Problema | Causa provável | Solução |
|----------|----------------|---------|
| `ECONNREFUSED` ao rodar dev | PostgreSQL não está rodando | `docker compose up -d` |
| Prisma: "table does not exist" | Schema não foi aplicado | `npm run db:push` |
| Login falha com credenciais corretas | Seed não foi executado | `npm run db:seed` |
| Porta 3000 ocupada | Outro processo usando | `lsof -i :3000` e matar o processo |
| Porta 5432 ocupada | PostgreSQL local rodando | Parar o serviço local ou mudar a porta no docker-compose |
| Build de produção falha | Falta de memória | Usar VPS com pelo menos 2GB RAM ou criar swap |

### Criar swap (VPS com pouca RAM)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 9. Resumo de credenciais (ambiente local)

| Serviço | Dado | Valor |
|---------|------|-------|
| PostgreSQL | Host | localhost:5432 |
| PostgreSQL | Usuário | trama |
| PostgreSQL | Senha | trama_local_2026 |
| PostgreSQL | Database | trama |
| App | URL | http://localhost:3000 |
| App | Email | pesquisador@trama.app.br |
| App | Senha | trama2026 |
| Prisma Studio | URL | http://localhost:5555 |

---

## 10. Próximos passos após validação

Funcionalidades para implementar depois do MVP:

1. **Upload de arquivos** (TXT, PDF, DOCX) com extração de texto
2. **Login social** (Google, GitHub) via OAuth
3. **Exportação** de relatórios em PDF e Markdown
4. **Convite de membros** com roles (Owner, Editor, Viewer)
5. **Busca avançada** cross-documento
6. **Matriz código-documento** (visualização)
7. **Word cloud** por projeto
8. **PWA** para acesso mobile offline

Cada funcionalidade pode ser desenvolvida localmente e deployada com um simples `git pull + docker compose up --build` no servidor.
