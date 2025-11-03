# 🔒 Configurar HTTPS en el Backend - Nginx + SSL

## 📋 **Requisitos**

- Servidor: 15.204.220.159
- Puerto backend: 8000
- Necesitas un dominio (ej: `api.clockwise.com` o `clockwise-api.tudominio.com`)

---

## 🚀 **Paso 1: Configurar Dominio**

### Opción A: Si tienes dominio propio

En tu proveedor de DNS (GoDaddy, Namecheap, Cloudflare, etc):

```
Tipo: A
Nombre: api (o clockwise-api)
Valor: 15.204.220.159
TTL: 300
```

Resultado: `api.tudominio.com` → `15.204.220.159`

### Opción B: Si NO tienes dominio

Usa un servicio gratuito como:
- **DuckDNS** (gratis): `clockwise.duckdns.org`
- **No-IP** (gratis): `clockwise.ddns.net`
- **FreeDNS** (gratis): `clockwise.afraid.org`

---

## 🛠️ **Paso 2: Instalar Nginx y Certbot**

SSH a tu servidor `15.204.220.159`:

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Nginx
sudo apt install nginx -y

# Instalar Certbot (para SSL gratis)
sudo apt install certbot python3-certbot-nginx -y

# Verificar que Nginx esté corriendo
sudo systemctl status nginx
```

---

## ⚙️ **Paso 3: Configurar Nginx como Reverse Proxy**

```bash
# Crear archivo de configuración
sudo nano /etc/nginx/sites-available/clockwise-api
```

Pega esto (cambia `api.tudominio.com` por tu dominio real):

```nginx
server {
    listen 80;
    server_name api.tudominio.com;  # ← CAMBIA ESTO

    # Redirigir HTTP a HTTPS (después de obtener certificado)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
}
```

```bash
# Activar el sitio
sudo ln -s /etc/nginx/sites-available/clockwise-api /etc/nginx/sites-enabled/

# Eliminar sitio default (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Si todo está OK, reiniciar Nginx
sudo systemctl restart nginx
```

---

## 🔐 **Paso 4: Obtener Certificado SSL (GRATIS)**

```bash
# Obtener certificado SSL de Let's Encrypt
sudo certbot --nginx -d api.tudominio.com

# Certbot te preguntará:
# 1. Email: tu@email.com (para notificaciones)
# 2. Términos: Yes
# 3. Compartir email: No
# 4. Redirect HTTP a HTTPS: Yes (opción 2)

# Verificar auto-renovación
sudo certbot renew --dry-run

# Si todo OK, verás:
# "Congratulations! Your certificate will not expire until..."
```

---

## 🎯 **Paso 5: Actualizar Vercel**

### En Vercel Dashboard:

1. Ir a tu proyecto → Settings → Environment Variables
2. Editar `REACT_APP_API_BASE_URL`
3. Cambiar a: `https://api.tudominio.com`
4. Save
5. Ir a Deployments → ... → Redeploy

---

## ✅ **Verificar que Funciona**

```bash
# Desde tu computadora, probar:
curl https://api.tudominio.com/api/auth/token \
  -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=carlos@elsaborlatino.com&password=SecurePass123!"

# Deberías ver:
# {"access_token":"eyJ...","token_type":"bearer",...}
```

---

## 🔧 **Troubleshooting**

### Error: "Connection refused"

```bash
# Verificar que tu backend esté corriendo
curl http://localhost:8000/api/auth/token

# Si no responde, iniciar backend:
cd /ruta/a/tu/backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Error: "502 Bad Gateway"

```bash
# Verificar logs de Nginx
sudo tail -f /var/log/nginx/error.log

# Verificar que Nginx esté corriendo
sudo systemctl status nginx

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Error: "Certificate not found"

```bash
# Volver a obtener certificado
sudo certbot --nginx -d api.tudominio.com --force-renewal
```

---

## 📱 **Configurar Auto-Renovación SSL**

El certificado expira cada 90 días, pero Certbot renueva automáticamente:

```bash
# Verificar que el cron job esté activo
sudo systemctl status certbot.timer

# Si no está activo:
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test manual de renovación
sudo certbot renew --dry-run
```

---

## 🎉 **Resultado Final**

Después de completar estos pasos:

✅ Backend accesible en: `https://api.tudominio.com`
✅ Certificado SSL válido (gratis)
✅ Auto-renovación cada 90 días
✅ Vercel funcionando perfectamente
✅ CORS configurado correctamente

---

## 💡 **Alternativa Rápida: Cloudflare Tunnel**

Si no quieres lidiar con Nginx, usa Cloudflare Tunnel:

```bash
# Instalar
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Autenticar
cloudflared tunnel login

# Crear túnel
cloudflared tunnel create clockwise

# Ruta DNS
cloudflared tunnel route dns clockwise api.tudominio.com

# Configurar
cat > ~/.cloudflared/config.yml << 'EOF'
url: http://localhost:8000
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json
EOF

# Ejecutar como servicio
sudo cloudflared service install
sudo systemctl start cloudflared
```

✅ Más fácil que Nginx
✅ No necesitas gestionar certificados
✅ HTTPS automático

---

## 📞 **¿Necesitas Ayuda?**

Si tienes problemas, envíame:
- El dominio que estás usando
- Output de `sudo nginx -t`
- Output de `curl http://localhost:8000`

