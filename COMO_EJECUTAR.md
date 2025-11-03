# 🚀 Cómo Ejecutar ClockWise Frontend

**Fecha**: 2025-11-03
**Estado**: ✅ Funcionando

---

## 📋 Requisitos Previos

- Node.js 16+ instalado
- npm instalado
- Backend corriendo en `http://15.204.220.159:8000` o localmente

---

## 🎯 Opción 1: Usando npm run dev (Recomendado)

```bash
cd /Users/mac/Desktop/clockwise_desktop
npm run dev
```

## 🎯 Opción 2: Usando npm start

```bash
cd /Users/mac/Desktop/clockwise_desktop
npm start
```

**Ambos comandos hacen lo mismo**: Inician el servidor de desarrollo de React.

---

## 🌐 URLs de Acceso

Una vez iniciado, la aplicación estará disponible en:

- **Frontend**: http://localhost:3000
- **Backend (producción)**: http://15.204.220.159:8000
- **Backend (local)**: http://localhost:8000

---

## 🔐 Credenciales de Prueba

### Super Admin
```
Usuario: admin@clockwise.com
Contraseña: [tu contraseña de super admin]
```

### Business (después de registrar)
```
Usuario: [el email que registraste]
Contraseña: [tu contraseña]
```

---

## 📱 Páginas Disponibles

### Para Super Admin:
1. `/super-admin/login` - Login
2. `/super-admin/dashboard` - Dashboard
3. `/super-admin/businesses` - Lista de negocios
4. `/super-admin/register-business` - Registrar nuevo negocio

### Para Business:
1. `/business/login` - Login
2. `/business/dashboard` - Dashboard
3. `/business/employees` - Lista de empleados
4. `/business/employees/register` - Registrar empleado
5. `/business/time-entry` - Time tracking (facial recognition)
6. **`/business/tips`** ⭐ **NUEVO** - Reportar propinas y bonos
7. `/business/payroll` - Calcular nómina
8. `/business/reports` - Reportes

---

## 🎨 Menú de Navegación (Business Portal)

Una vez que hagas login como Business, verás el menú lateral con:

1. 📊 **Dashboard** - Vista general
2. 👥 **Employees** - Gestión de empleados
3. ⏰ **Time Tracking** - Registro de tiempo
4. 💵 **Tips & Bonuses** ⭐ **NUEVO** - Reportar propinas
5. 💰 **Payroll** - Cálculo de nómina
6. 📈 **Reports** - Reportes y estadísticas

---

## 🔧 Scripts Disponibles

```bash
# Iniciar servidor de desarrollo
npm run dev
# o
npm start

# Compilar para producción
npm run build

# Ejecutar tests
npm test
```

---

## 🆕 Nuevas Funcionalidades

### 1. Reportar Propinas (CRÍTICO) ⭐

**Ubicación**: Business Portal → Tips & Bonuses

**Funcionalidades**:
- Seleccionar empleado de la lista
- Elegir tipo: Tips o Bonus
- Ingresar monto y fecha
- Agregar descripción opcional
- Ver historial de incidentes por empleado

**Flujo**:
1. Login como Business
2. Click en "Tips & Bonuses" en el menú
3. Seleccionar empleado
4. Elegir "Tips"
5. Ingresar monto (ej: 150.00)
6. Seleccionar fecha
7. Click "Report Tips"
8. ✅ Propinas registradas!

**Por qué es importante**: Estas propinas se usan en el cálculo de nómina para determinar si el empleador debe compensar el "tip credit" según FLSA.

---

## 🐛 Solución de Problemas

### Error: "Cannot find module"
```bash
cd /Users/mac/Desktop/clockwise_desktop
npm install
npm run dev
```

### Error: "Port 3000 is already in use"
```bash
# Matar proceso en puerto 3000
lsof -ti:3000 | xargs kill -9

# Reiniciar
npm run dev
```

### Error: "API request failed"
- Verificar que el backend esté corriendo
- Verificar la URL en `src/config/api.ts`
- Verificar que tengas token válido (hacer login)

### Errores de CORS
- El backend debe tener CORS configurado para `http://localhost:3000`
- Verificar en el backend: `app/core/config.py` → `CORS_ORIGINS`

---

## 📦 Dependencias Instaladas

```json
{
  "react": "^19.2.0",
  "react-router-dom": "^7.9.5",
  "axios": "^1.13.1",
  "typescript": "^4.9.5",
  "tailwindcss": "^3.4.18",
  "lucide-react": "^0.552.0",
  "date-fns": "^4.1.0"
}
```

---

## 🔗 Conexión con Backend

La aplicación se conecta al backend mediante Axios con interceptors automáticos para JWT.

**Configuración**: `src/config/api.ts`

```typescript
export const API_BASE_URL = 'http://15.204.220.159:8000';
```

**Cambiar a local**:
```typescript
export const API_BASE_URL = 'http://localhost:8000';
```

---

## 📊 Estado de Compilación

Cuando ejecutes `npm run dev`, deberías ver:

```
Compiled successfully!

You can now view clockwise_desktop in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000

Note that the development build is not optimized.
To create a production build, use npm run build.

webpack compiled with 0 errors
```

---

## ✅ Checklist de Verificación

Antes de reportar un problema, verifica:

- [ ] Node.js 16+ está instalado (`node --version`)
- [ ] npm está instalado (`npm --version`)
- [ ] Dependencias instaladas (`npm install`)
- [ ] Puerto 3000 disponible (`lsof -ti:3000`)
- [ ] Backend corriendo (visita `http://15.204.220.159:8000/docs`)
- [ ] Sin errores de TypeScript en la consola
- [ ] Token guardado después de login (F12 → Application → LocalStorage)

---

## 🎯 Flujo Completo de Prueba

### 1. Primera Vez

```bash
# 1. Instalar dependencias
cd /Users/mac/Desktop/clockwise_desktop
npm install

# 2. Iniciar aplicación
npm run dev

# 3. Abrir navegador
# Visita: http://localhost:3000
```

### 2. Uso Diario

```bash
cd /Users/mac/Desktop/clockwise_desktop
npm run dev
```

### 3. Probar Nueva Funcionalidad (Tips)

```
1. Abrir http://localhost:3000
2. Click "Login as Business"
3. Ingresar credenciales de business
4. Click "Tips & Bonuses" en el menú
5. Seleccionar un empleado con tip credit
6. Tipo: "Tips"
7. Monto: 150.00
8. Fecha: Hoy
9. Click "Report Tips"
10. ✅ Ver mensaje de éxito
11. Click "Show History" para ver el registro
```

---

## 📚 Documentación Adicional

- **FEATURES_ADDED.md** - Lista completa de features agregadas
- **PROJECT_SUMMARY.md** - Resumen técnico del proyecto
- **README.md** - Documentación principal

---

## 🔥 Hot Reload

El proyecto usa **React Hot Reload**. Cualquier cambio que hagas en el código se reflejará automáticamente en el navegador sin necesidad de recargar la página.

---

## 💡 Tips de Desarrollo

### Ver logs del backend en tiempo real
```bash
# En otra terminal
tail -f /ruta/al/backend/logs.log
```

### Ver errores de red
1. F12 (DevTools)
2. Tab "Network"
3. Filtrar por "XHR"
4. Ver requests a la API

### Ver estado de autenticación
1. F12 (DevTools)
2. Tab "Application"
3. LocalStorage → http://localhost:3000
4. Buscar "token" y "user"

---

## 🎉 ¡Listo!

Tu aplicación está corriendo en **http://localhost:3000**

**Próximos pasos**:
1. Login como Business
2. Ir a "Tips & Bonuses"
3. Reportar algunas propinas
4. Ir a "Payroll" y calcular nómina
5. Ver cómo el tip credit se calcula automáticamente

---

**¿Problemas?** Revisa la sección de Solución de Problemas arriba o consulta FEATURES_ADDED.md

**¿Todo funciona?** ¡Felicidades! Tu sistema ClockWise está listo para usar 🚀
