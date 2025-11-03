# 🚀 Solución RÁPIDA Sin Dominio - ngrok

## ✅ **Solución con ngrok (2 minutos)**

ngrok crea un túnel HTTPS GRATIS a tu backend sin necesidad de dominio.

---

## 📥 **Paso 1: Instalar ngrok**

### En tu servidor (15.204.220.159):

```bash
# SSH a tu servidor
ssh usuario@15.204.220.159

# Instalar ngrok
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | \
  sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && \
  echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | \
  sudo tee /etc/apt/sources.list.d/ngrok.list && \
  sudo apt update && \
  sudo apt install ngrok
```

---

## 🔑 **Paso 2: Configurar ngrok**

### Crear cuenta gratis:

1. Ve a: https://dashboard.ngrok.com/signup
2. Regístrate (gratis)
3. Copia tu authtoken de: https://dashboard.ngrok.com/get-started/your-authtoken

### Autenticar ngrok:

```bash
# En tu servidor
ngrok config add-authtoken <TU_TOKEN_AQUI>
```

---

## 🚀 **Paso 3: Crear Túnel HTTPS**

```bash
# Ejecutar ngrok (mantener corriendo)
ngrok http 8000
```

Verás algo como:

```
ngrok                                                                    

Session Status                online
Account                       Tu Cuenta (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def.ngrok-free.app -> http://localhost:8000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**🔥 COPIA ESTA URL:** `https://abc123def.ngrok-free.app`

---

## ⚙️ **Paso 4: Actualizar Vercel**

### En Vercel Dashboard:

1. Tu proyecto → **Settings** → **Environment Variables**
2. Editar `REACT_APP_API_BASE_URL`
3. Cambiar a: `https://abc123def.ngrok-free.app` (tu URL de ngrok)
4. **Save**
5. Ir a **Deployments** → Click en el último → **⋯** → **Redeploy**

---

## ✅ **Paso 5: Probar**

```bash
# Desde tu computadora, probar la URL de ngrok:
curl https://abc123def.ngrok-free.app/api/auth/token \
  -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=carlos@elsaborlatino.com&password=SecurePass123!"

# Deberías ver:
# {"access_token":"eyJ...","token_type":"bearer",...}
```

Si funciona → **Tu app en Vercel funcionará!** ✅

---

## 🔄 **Mantener ngrok Corriendo (Importante)**

### Opción A: En screen/tmux (recomendado)

```bash
# Instalar screen
sudo apt install screen

# Crear sesión
screen -S ngrok

# Ejecutar ngrok
ngrok http 8000

# Desconectar (pero dejar corriendo): Ctrl+A, luego D

# Reconectar después
screen -r ngrok
```

### Opción B: Como servicio systemd

```bash
# Crear servicio
sudo nano /etc/systemd/system/ngrok.service
```

Pega esto:

```ini
[Unit]
Description=ngrok HTTPS tunnel
After=network.target

[Service]
Type=simple
User=tu_usuario
WorkingDirectory=/home/tu_usuario
ExecStart=/usr/local/bin/ngrok http 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Activar servicio
sudo systemctl daemon-reload
sudo systemctl enable ngrok
sudo systemctl start ngrok

# Ver logs para obtener URL
sudo journalctl -u ngrok -f
```

---

## ⚠️ **Limitaciones de ngrok GRATIS**

| Característica | Plan Free | Plan Paid |
|----------------|-----------|-----------|
| URL HTTPS | ✅ Sí | ✅ Sí |
| Cambia al reiniciar | ❌ Sí | ✅ URL fija |
| Requests/minuto | 40 | Ilimitado |
| Conexiones simultáneas | 1 túnel | Múltiples |

**Para tu caso:** El plan FREE es suficiente si mantienes ngrok corriendo.

---

## 🎯 **Alternativa: Cloudflare Workers (Sin ngrok)**

Si no quieres instalar nada en el servidor, usa Cloudflare Workers como proxy:

### Paso 1: Crear Worker en Cloudflare (Gratis)

1. Ve a: https://workers.cloudflare.com
2. Sign up (gratis)
3. Create a Service
4. Pega este código:

```javascript
export default {
  async fetch(request) {
    // Cambiar la URL a tu backend
    const url = new URL(request.url);
    const backendUrl = `http://15.204.220.159:8000${url.pathname}${url.search}`;
    
    // Copiar headers
    const headers = new Headers(request.headers);
    
    // Hacer request al backend
    const response = await fetch(backendUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined,
    });
    
    // Copiar response y agregar CORS
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return newResponse;
  },
};
```

5. Deploy
6. Te da URL: `https://clockwise-proxy.tu-usuario.workers.dev`

### Paso 2: En Vercel

```
REACT_APP_API_BASE_URL=https://clockwise-proxy.tu-usuario.workers.dev
```

✅ **Ventajas:**
- Gratis
- Sin instalar nada en el servidor
- URL fija
- 100,000 requests/día gratis

---

## 🏆 **Recomendación Final**

**Para empezar YA (2 minutos):**
→ **ngrok** (mantener corriendo con screen)

**Para producción (10 minutos):**
→ **Cloudflare Workers** (gratis, sin dominio)

**Para profesional (30 minutos):**
→ Consigue dominio gratis en DuckDNS + Nginx + SSL

---

## 🆘 **Ayuda Rápida**

¿Cuál prefieres?

1. **ngrok** → Te guío paso a paso ahora
2. **Cloudflare Workers** → Te creo el worker completo
3. **DuckDNS + SSL** → Te ayudo a configurar

Dime cuál y te ayudo a implementarlo inmediatamente.

