# 🚀 Deploy en Vercel - Solución al Error Mixed Content

## ❌ **El Problema**

```
Mixed Content: The page at 'https://clockwisefrontend.vercel.app' 
was loaded over HTTPS, but requested an insecure XMLHttpRequest 
endpoint 'http://15.204.220.159:8000/api/...'
```

**Causa:** Vercel usa HTTPS, tu backend usa HTTP. Los navegadores bloquean esto por seguridad.

---

## ✅ **SOLUCIÓN RECOMENDADA: Cloudflare Tunnel (GRATIS)**

### Paso 1: Instalar Cloudflare Tunnel en tu servidor

SSH a tu servidor (15.204.220.159):

```bash
# Descargar cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Autenticar (abrirá navegador)
cloudflared tunnel login

# Crear túnel
cloudflared tunnel create clockwise-backend

# Configurar túnel
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml << 'EOF'
url: http://localhost:8000
tunnel: <TUNNEL-ID-QUE-TE-DIO>
credentials-file: /root/.cloudflared/<TUNNEL-ID>.json
EOF

# Crear ruta DNS
cloudflared tunnel route dns clockwise-backend api.tudominio.com

# Ejecutar túnel
cloudflared tunnel run clockwise-backend
```

### Paso 2: Actualizar variable de entorno en Vercel

En Vercel → Settings → Environment Variables:

```
REACT_APP_API_BASE_URL=https://api.tudominio.com
```

✅ **Ventajas:**
- HTTPS gratis
- Sin certificados manuales
- URL personalizada
- Funciona inmediatamente

---

## ⚡ **SOLUCIÓN RÁPIDA: ngrok (Temporal)**

### Paso 1: Instalar ngrok

```bash
# En tu servidor
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Autenticar
ngrok config add-authtoken <TU_TOKEN>

# Crear túnel HTTPS
ngrok http 8000
```

### Paso 2: Usar URL de ngrok en Vercel

```
REACT_APP_API_BASE_URL=https://abc123.ngrok.io
```

⚠️ **Nota:** La URL cambia cada vez que reinicias ngrok (necesitas plan pago para URL fija).

---

## 🔒 **SOLUCIÓN PERMANENTE: HTTPS en el Backend**

### Opción A: Nginx + Let's Encrypt (Gratis)

```bash
# Instalar Nginx y Certbot
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx

# Configurar Nginx
sudo nano /etc/nginx/sites-available/clockwise

# Pegar:
server {
    listen 80;
    server_name api.tudominio.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Activar sitio
sudo ln -s /etc/nginx/sites-available/clockwise /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Obtener certificado SSL GRATIS
sudo certbot --nginx -d api.tudominio.com

# Auto-renovación
sudo certbot renew --dry-run
```

### Paso 2: Actualizar Vercel

```
REACT_APP_API_BASE_URL=https://api.tudominio.com
```

✅ **Ventajas:**
- Solución profesional
- SSL gratis con Let's Encrypt
- Renovación automática
- Control total

---

## 🎯 **SOLUCIÓN MÁS RÁPIDA AHORA MISMO**

### 1. Usa ngrok (5 minutos):

```bash
# En tu servidor donde está el backend
ngrok http 8000
```

Te dará algo como: `https://abc123.ngrok-free.app`

### 2. En Vercel Environment Variables:

```
REACT_APP_API_BASE_URL=https://abc123.ngrok-free.app
```

### 3. Redeploy en Vercel

✅ **Funcionará inmediatamente**

---

## 📝 **IMPORTANTE**

**NO PUEDES** usar `http://15.204.220.159:8000` en Vercel porque:
- ❌ Vercel = HTTPS
- ❌ Tu backend = HTTP
- ❌ Navegadores bloquean mixed content

**DEBES** tener el backend en HTTPS:
- ✅ Cloudflare Tunnel (gratis, permanente)
- ✅ ngrok (gratis, temporal)
- ✅ Nginx + Let's Encrypt (gratis, profesional)

---

## 🚀 **Recomendación**

1. **Ahora mismo:** Usa ngrok (5 min)
2. **Después:** Configura Cloudflare Tunnel o Nginx + SSL

¿Cuál prefieres usar?

