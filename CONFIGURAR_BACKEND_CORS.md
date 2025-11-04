# 🔧 Configurar CORS en Backend Python (FastAPI)

## 🎯 **Tu URL de ngrok:** `https://ac2fe07f3596.ngrok-free.app`

Para que tu backend acepte peticiones desde Vercel, necesitas configurar CORS.

---

## 📝 **Paso 1: Editar el archivo principal del backend**

SSH a tu servidor:

```bash
ssh usuario@15.204.220.159
```

Encuentra tu archivo principal (usualmente `main.py` o `app.py`):

```bash
# Buscar el archivo
find /Users/mac/Desktop/clockwise -name "main.py" -o -name "app.py" 2>/dev/null

# O si sabes la ruta
cd /Users/mac/Desktop/clockwise
```

---

## 🔧 **Paso 2: Agregar CORS Middleware**

Edita el archivo principal:

```bash
nano main.py
# o
nano app/main.py
```

### Busca la sección donde se crea la app de FastAPI:

```python
from fastapi import FastAPI

app = FastAPI()
```

### AGREGA esto justo después:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # ← AGREGAR ESTA LÍNEA

app = FastAPI()

# ← AGREGAR TODA ESTA SECCIÓN
# Configurar CORS para Vercel
origins = [
    "http://localhost:3000",  # Desarrollo local
    "https://clockwisefrontend.vercel.app",  # Producción Vercel
    "https://*.vercel.app",  # Cualquier preview de Vercel
    "https://ac2fe07f3596.ngrok-free.app",  # ngrok URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 💡 **Versión Permisiva (Para Desarrollo)**

Si prefieres permitir TODAS las peticiones (menos seguro pero más fácil):

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS permisivo (desarrollo)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite TODOS los orígenes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🔄 **Paso 3: Reiniciar el Backend**

```bash
# Opción A: Si usas uvicorn directamente
# Detener (Ctrl+C) y reiniciar:
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Opción B: Si usas systemd
sudo systemctl restart tu-servicio-backend

# Opción C: Si usas screen para el backend también
screen -r backend  # o el nombre que uses
# Ctrl+C para detener
# Subir flecha para repetir comando anterior
# Enter para reiniciar
# Ctrl+A, luego D para salir
```

---

## ✅ **Verificar que Funciona**

Desde tu computadora local:

```bash
# Test desde Vercel/ngrok
curl https://ac2fe07f3596.ngrok-free.app/api/auth/token \
  -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Origin: https://clockwisefrontend.vercel.app" \
  -d "username=carlos@elsaborlatino.com&password=SecurePass123!" \
  -i | head -20

# Deberías ver en los headers:
# access-control-allow-origin: https://clockwisefrontend.vercel.app
```

---

## 🎯 **Paso 4: Actualizar Vercel**

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Edita `REACT_APP_API_BASE_URL`
4. Cambia a: `https://ac2fe07f3596.ngrok-free.app`
5. Save
6. Deployments → Último deployment → ⋯ → Redeploy

---

## 🔍 **Troubleshooting**

### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"

```python
# Asegúrate de que la configuración CORS esté ANTES de las rutas
# Debe estar inmediatamente después de app = FastAPI()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Temporal para debug
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Después van tus rutas
@app.get("/")
def read_root():
    return {"Hello": "World"}
```

### Error: "Module 'fastapi.middleware.cors' not found"

```bash
# CORS viene con FastAPI, pero si falta:
pip install fastapi[all]
# o
pip install python-multipart
```

---

## 📋 **Resumen de URLs**

| Dónde | URL |
|-------|-----|
| **ngrok (Backend)** | `https://ac2fe07f3596.ngrok-free.app` |
| **Vercel (Frontend)** | `https://clockwisefrontend.vercel.app` |
| **Desarrollo Local** | `http://localhost:3000` |

---

## ✅ **Checklist Final**

- [ ] CORS configurado en `main.py`
- [ ] Backend reiniciado
- [ ] ngrok corriendo en screen (Ctrl+A, D)
- [ ] URL de ngrok copiada
- [ ] Variable en Vercel actualizada: `REACT_APP_API_BASE_URL=https://ac2fe07f3596.ngrok-free.app`
- [ ] Redeploy en Vercel
- [ ] Probar login en https://clockwisefrontend.vercel.app

---

## 🎉 **Resultado Esperado**

Después de estos pasos:

✅ Frontend en Vercel: https://clockwisefrontend.vercel.app
✅ Backend vía ngrok: https://ac2fe07f3596.ngrok-free.app
✅ Login funcionando
✅ Dashboard mostrando datos
✅ TODO funcionando end-to-end

---

## 💾 **Guardar para Producción**

Cuando tengas tiempo, considera:
- DuckDNS (dominio gratis) + Let's Encrypt (SSL gratis)
- Cloudflare Tunnel (sin dominio, permanente)

Pero por ahora ngrok + screen funciona perfectamente!

