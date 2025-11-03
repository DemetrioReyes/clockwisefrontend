#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         🚀 Script de Setup Automático para ngrok             ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Verificar si ngrok está instalado
if ! command -v ngrok &> /dev/null; then
    echo "📥 Instalando ngrok..."
    curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | \
      sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
    echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | \
      sudo tee /etc/apt/sources.list.d/ngrok.list
    sudo apt update
    sudo apt install ngrok -y
    echo "✅ ngrok instalado"
else
    echo "✅ ngrok ya está instalado"
fi

# Verificar si screen está instalado
if ! command -v screen &> /dev/null; then
    echo "📥 Instalando screen..."
    sudo apt install screen -y
    echo "✅ screen instalado"
else
    echo "✅ screen ya está instalado"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔑 IMPORTANTE: Necesitas configurar tu authtoken de ngrok"
echo ""
echo "1. Ve a: https://dashboard.ngrok.com/get-started/your-authtoken"
echo "2. Copia tu authtoken"
echo "3. Ejecuta: ngrok config add-authtoken <TU_TOKEN>"
echo ""
read -p "¿Ya configuraste tu authtoken? (y/n): " configured

if [ "$configured" != "y" ]; then
    echo ""
    echo "⚠️  Por favor configura tu authtoken primero:"
    echo "   ngrok config add-authtoken <TU_TOKEN>"
    echo ""
    exit 1
fi

echo ""
echo "🚀 Iniciando ngrok en screen..."
echo ""

# Matar sesión anterior si existe
screen -X -S ngrok quit 2>/dev/null

# Crear nueva sesión y ejecutar ngrok
screen -dmS ngrok ngrok http 8000

# Esperar 3 segundos para que ngrok inicie
sleep 3

echo "✅ ngrok está corriendo en background!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 OBTENER TU URL HTTPS:"
echo ""
echo "Opción 1: Reconectar a screen"
echo "   $ screen -r ngrok"
echo "   (Verás la URL en pantalla)"
echo "   (Presiona Ctrl+A, luego D para salir)"
echo ""
echo "Opción 2: API de ngrok"
echo "   $ curl http://localhost:4040/api/tunnels | jq '.tunnels[0].public_url'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Intentando obtener URL automáticamente..."

# Esperar un poco más
sleep 2

# Obtener URL de ngrok
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*ngrok[^"]*' | head -1)

if [ -n "$NGROK_URL" ]; then
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                    🎉 URL DE NGROK                            ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "   $NGROK_URL"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📋 PRÓXIMOS PASOS:"
    echo ""
    echo "1. Copia esta URL: $NGROK_URL"
    echo ""
    echo "2. Ve a Vercel:"
    echo "   Settings → Environment Variables"
    echo "   REACT_APP_API_BASE_URL=$NGROK_URL"
    echo ""
    echo "3. Redeploy en Vercel"
    echo ""
    echo "4. ✅ Tu app funcionará!"
    echo ""
else
    echo "⚠️  No se pudo obtener la URL automáticamente"
    echo "   Ejecuta: screen -r ngrok"
    echo "   Para ver la URL en pantalla"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 COMANDOS ÚTILES:"
echo ""
echo "   Ver si ngrok está corriendo:"
echo "   $ screen -ls"
echo ""
echo "   Reconectar a ngrok:"
echo "   $ screen -r ngrok"
echo ""
echo "   Salir de screen:"
echo "   Ctrl+A, luego D"
echo ""
echo "   Reiniciar ngrok:"
echo "   $ screen -X -S ngrok quit"
echo "   $ screen -dmS ngrok ngrok http 8000"
echo ""
echo "╚═══════════════════════════════════════════════════════════════╝"

