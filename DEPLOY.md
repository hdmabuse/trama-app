# Deploy no Digital Ocean via GitHub

## 1. Criar Droplet

1. Acesse [Digital Ocean](https://cloud.digitalocean.com)
2. Clique em **Create → Droplet**
3. Escolha a imagem: **Ubuntu 22.04 (LTS)**
4. Selecione o tamanho (Basic com $4/mês é suficiente)
5. Escolha a região mais próxima
6. Adicione sua SSH key ou crie uma senha
7. Nomeie o droplet e clique em **Create Droplet**

## 2. Configurar o Servidor

Conecte ao droplet via SSH:
```bash
ssh root@<IP_DO_DROPLET>
```

### Atualizar e instalar dependências:
```bash
apt update && apt upgrade -y
apt install -y curl git nginx
```

### Instalar Node.js 20.x:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v  # Verificar versão
```

### Instalar PM2 (gerenciador de processos):
```bash
npm install -g pm2
```

## 3. Configurar GitHub Actions para Deploy Automático

### Criar usuário de deploy:
```bash
adduser deploy
usermod -aG sudo deploy
su - deploy
ssh-keygen -t ed25519 -C "deploy@trama"
cat ~/.ssh/id_ed25519.pub
```

### Adicionar a chave pública no GitHub:
1. Acesse **Settings → SSH and GPG keys → New SSH key**
2. Cole a chave pública

### No servidor, configurar o deploy:
```bash
su - deploy
mkdir -p ~/trama-app
```

### Criar Action Secrets no GitHub:
1. Repo → **Settings → Secrets and variables → Actions**
2. Adicionar secrets:
   - `SSH_HOST`: IP do droplet
   - `SSH_USERNAME`: deploy
   - `SSH_KEY`: Chave privada (conteúdo de ~/.ssh/id_ed25519)

### Criar workflow de deploy:

Crie `.github/workflows/deploy.yml`:

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
            git pull origin main
            npm install
            npm run build
            pm2 restart trama || pm2 start npm --name trama -- run dev -- -p 3000
```

## 4. Configurar Nginx como Proxy Reverso

```bash
nano /etc/nginx/sites-available/trama
```

Conteúdo:
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

Ativar o site:
```bash
ln -s /etc/nginx/sites-available/trama /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## 5. Configurar Domínio (opcional)

1. No Digital Ocean, vá em **Networking → Domains**
2. Adicione seu domínio
3. Crie um registro A pointing para o IP do droplet

## 6. Variáveis de Ambiente

No servidor, crie o arquivo `.env`:
```bash
cd ~/trama-app
nano .env
```

Adicione todas as variáveis necessárias (DATABASE_URL, NEXTAUTH_SECRET, etc).

## 7. Comandos Úteis PM2

```bash
pm2 status          # Ver status
pm2 logs            # Ver logs
pm2 restart trama   # Reiniciar
pm2 stop trama      # Parar
```

## 8. Configurar Firewall (recomendado)

```bash
ufw allow 22        # SSH
ufw allow 80        # HTTP
uffw allow 443      # HTTPS
ufw enable
```