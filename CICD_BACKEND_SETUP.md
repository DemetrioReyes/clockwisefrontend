# 🚀 CI/CD Automático para Backend Python (FastAPI)

## 📋 Objetivo
Automatizar el despliegue del backend cada vez que hagas `git push` al repositorio.

---

## 🎯 Solución: GitHub Actions

### **Flujo:**
```
git push → GitHub Actions → SSH al servidor → Pull code → Restart API
```

---

## 📝 Paso 1: Configurar SSH en tu Servidor

### **1.1 Crear usuario de deploy (en tu servidor)**

```bash
# SSH a tu servidor
ssh usuario@15.204.220.159

# Crear usuario para deploy
sudo adduser deploy
sudo usermod -aG sudo deploy

# Cambiar a usuario deploy
sudo su - deploy
```

### **1.2 Generar SSH Key para GitHub Actions**

```bash
# Como usuario deploy
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions

# Agregar a authorized_keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Mostrar la CLAVE PRIVADA (guardarla para después)
cat ~/.ssh/github_actions
```

**⚠️ COPIA Y GUARDA LA CLAVE PRIVADA COMPLETA** (desde `-----BEGIN...` hasta `...END-----`)

---

## 📝 Paso 2: Preparar el Backend en Git

### **2.1 Crear repositorio para el backend**

```bash
# En tu Mac, en la carpeta del backend Python
cd /Users/mac/Desktop/clockwise  # (o donde esté tu API)

git init
git add .
git commit -m "Initial commit - ClockWise API"

# Crear repo en GitHub y conectarlo
git remote add origin git@github.com:TU_USUARIO/clockwise-backend.git
git branch -M main
git push -u origin main
```

### **2.2 Crear archivo de deploy script**

Crear `deploy.sh` en la raíz del proyecto backend:

```bash
#!/bin/bash
# deploy.sh - Script de deploy automático

set -e  # Salir si hay error

echo "🚀 Iniciando deploy..."

# 1. Ir a la carpeta del proyecto
cd /home/deploy/clockwise

# 2. Pull del código más reciente
echo "📥 Descargando código..."
git pull origin main

# 3. Activar entorno virtual
echo "🐍 Activando entorno virtual..."
source venv/bin/activate

# 4. Instalar/actualizar dependencias
echo "📦 Instalando dependencias..."
pip install -r requirements.txt

# 5. Reiniciar el servicio
echo "🔄 Reiniciando servicio..."
sudo systemctl restart clockwise-api

# 6. Verificar que esté corriendo
sleep 3
if systemctl is-active --quiet clockwise-api; then
    echo "✅ Deploy completado exitosamente!"
else
    echo "❌ Error: El servicio no está corriendo"
    exit 1
fi
```

```bash
# Hacer ejecutable
chmod +x deploy.sh

# Commit
git add deploy.sh
git commit -m "Add deploy script"
git push
```

---

## 📝 Paso 3: Configurar Systemd Service

### **3.1 Crear servicio systemd (en el servidor)**

```bash
# En el servidor como root/sudo
sudo nano /etc/systemd/system/clockwise-api.service
```

**Contenido:**
```ini
[Unit]
Description=ClockWise FastAPI Application
After=network.target

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/home/deploy/clockwise
Environment="PATH=/home/deploy/clockwise/venv/bin"
ExecStart=/home/deploy/clockwise/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

### **3.2 Habilitar el servicio**

```bash
sudo systemctl daemon-reload
sudo systemctl enable clockwise-api
sudo systemctl start clockwise-api

# Verificar
sudo systemctl status clockwise-api
```

### **3.3 Dar permiso a deploy para reiniciar**

```bash
# Crear archivo sudoers
sudo visudo -f /etc/sudoers.d/deploy

# Agregar esta línea:
deploy ALL=(ALL) NOPASSWD: /bin/systemctl restart clockwise-api, /bin/systemctl status clockwise-api
```

---

## 📝 Paso 4: Configurar GitHub Actions

### **4.1 Crear workflow en el repo del backend**

Crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: 🚀 Deploy to Server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: 22
          script: |
            cd /home/deploy/clockwise
            bash deploy.sh
```

### **4.2 Agregar Secrets en GitHub**

1. Ve a tu repo en GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

Agregar estos 3 secrets:

| Name | Value |
|------|-------|
| `SERVER_HOST` | `15.204.220.159` |
| `SERVER_USER` | `deploy` |
| `SSH_PRIVATE_KEY` | *La clave privada que guardaste en Paso 1.2* |

---

## 📝 Paso 5: Clonar Código en el Servidor

```bash
# En el servidor como usuario deploy
sudo su - deploy
cd ~

# Clonar el repositorio
git clone git@github.com:TU_USUARIO/clockwise-backend.git clockwise
cd clockwise

# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
nano .env
# Agregar tus variables (DB_URL, SECRET_KEY, etc.)

# Hacer el deploy inicial
bash deploy.sh
```

---

## ✅ Paso 6: ¡Probar!

### **Ahora cuando hagas cambios:**

```bash
# En tu Mac
cd /Users/mac/Desktop/clockwise  # Backend

# Hacer cambios en tu código
nano main.py  # o cualquier archivo

# Commit y push
git add .
git commit -m "feat: Agregar nuevo endpoint"
git push

# 🎉 GitHub Actions automáticamente:
# 1. Detecta el push
# 2. SSH al servidor
# 3. Pull del código
# 4. Instala dependencias
# 5. Reinicia el servicio
# ✅ Todo en ~30 segundos
```

### **Ver el progreso:**
1. Ve a GitHub → tu repo → pestaña **Actions**
2. Verás el workflow ejecutándose en tiempo real

---

## 🔧 Alternativa 2: Deploy con Docker (Más Profesional)

Si quieres algo más robusto:

### **Dockerfile** (en tu backend):

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### **docker-compose.yml**:

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - SECRET_KEY=${SECRET_KEY}
    restart: unless-stopped
```

### **deploy.sh** (con Docker):

```bash
#!/bin/bash
cd /home/deploy/clockwise
git pull origin main
docker-compose down
docker-compose up -d --build
docker-compose logs -f api
```

---

## 🎯 Opción 3: Railway/Render (Super Fácil)

Si no quieres configurar nada:

### **Railway.app (Gratis):**

1. Ve a https://railway.app
2. Conecta tu repo de GitHub
3. Railway detecta automáticamente FastAPI
4. Cada push → deploy automático
5. Te da URL HTTPS gratis

### **Render.com (Gratis):**

1. Ve a https://render.com
2. **New** → **Web Service**
3. Conecta GitHub
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Deploy automático con cada push

---

## 📊 Comparación de Opciones

| Opción | Dificultad | Costo | Control | HTTPS |
|--------|------------|-------|---------|-------|
| **GitHub Actions** | Media | Gratis | Total | Requiere setup |
| **Docker** | Alta | Gratis | Total | Requiere setup |
| **Railway** | Fácil | Gratis* | Limitado | ✅ Incluido |
| **Render** | Fácil | Gratis* | Limitado | ✅ Incluido |

*Gratis con límites, planes pagos disponibles

---

## 🚀 Mi Recomendación

### **Para empezar rápido:**
👉 **Railway.app** o **Render.com**
- Setup en 5 minutos
- HTTPS gratis
- Deploy automático
- No necesitas servidor

### **Para producción con control:**
👉 **GitHub Actions + tu servidor**
- Control total
- Tu infraestructura
- Más configurable

---

## 📝 Ejemplo Completo: Railway

### **1. Crear `railway.json`:**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### **2. Push a GitHub:**

```bash
git add railway.json
git commit -m "Add Railway config"
git push
```

### **3. Conectar en Railway:**
- railway.app → New Project → Deploy from GitHub
- Selecciona tu repo
- Railway automáticamente:
  - Detecta Python
  - Instala requirements.txt
  - Corre uvicorn
  - Te da URL HTTPS
  - Deploy automático con cada push

---

## ✅ Resultado Final

Sin importar la opción:

```
Antes:
1. Editar código en Mac
2. scp archivo al servidor
3. SSH al servidor
4. Reiniciar manualmente
5. Verificar

Después:
1. git push
2. ✅ ¡LISTO! (todo automático)
```

---

## 🎯 ¿Cuál prefieres?

Dime cuál opción te interesa y te ayudo a configurarla paso a paso:

- [ ] **GitHub Actions** (tu servidor)
- [ ] **Docker + GitHub Actions**
- [ ] **Railway.app** (más fácil)
- [ ] **Render.com** (alternativa)

¡Elige una y la configuramos juntos! 🚀

