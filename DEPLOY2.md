# Deploy no Digital Ocean (Droplet já criado)

## 1. Conectar ao Droplet

```bash
ssh root@<IP_DO_DROPLET>
```

## 2. Configurar o Servidor

```bash
# Atualizar e instalar dependências
apt update && apt upgrade -y
apt install -y curl git nginx

# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Instalar PM2
npm install -g pm2
```

## 3. Criar Usuário de Deploy

```bash
adduser deploy
usermod -aG sudo deploy

# Gerar chave SSH para o usuário deploy
su - deploy
ssh-keygen -t ed25519 -C "deploy@trama"
cat ~/.ssh/id_ed25519.pub
```

Adicionar a chave pública no GitHub: **Settings → SSH and GPG keys → New SSH key**

## 4. Preparar Diretório do Projeto

```bash
su - deploy
cd ~
mkdir trama-app
cd trama-app
git init
git remote add origin git@github.com:<SEU_USUARIO>/trama-app.git
```

## 5. Configurar Variáveis de Ambiente

```bash
cd ~/trama-app
nano .env
```

Adicione:
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://seu-dominio.com
```

## 6. Configurar GitHub Actions

No repositório GitHub: **Settings → Secrets and variables → Actions**

Adicionar secrets:
- `SSH_HOST`: IP do droplet
- `SSH_USERNAME`: deploy
- `SSH_KEY`: conteúdo do arquivo ~/.ssh/id_ed25519 do usuário deploy

Criar `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd ~/trama-app
            git fetch origin
            git reset --hard origin/main
            npm install
            npm run build
            pm2 restart trama || pm2 start npm --name trama -- run dev -- -p 3000
```

## 7. Configurar Nginx

```bash
nano /etc/nginx/sites-available/trama
```

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/trama /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## 8. Configurar Domínio (opcional)

No Digital Ocean: **Networking → Domains**
Adicionar domínio e criar registro A apontando para o IP do droplet.

## 9. Comandos Úteis

```bash
pm2 status      # Ver status
pm2 logs        # Ver logs
pm2 restart trama
```

## 10. Primeiro Deploy

```bash
# No servidor, fazer o primeiro pull manualmente
su - deploy
cd ~/trama-app
git pull origin main
npm install
npm run build
pm2 start npm --name trama -- run dev -- -p 3000
```

Depois é só fazer push para main que o GitHub Actions会自动 deploy.