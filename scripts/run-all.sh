#!/bin/bash
# run-all.sh
# Ejecuta todos los scripts de setup en orden

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ZEKER - GCP & FIREBASE SETUP                             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Verificar que estamos en la carpeta correcta
if [ ! -f "setup-gcp.sh" ]; then
    echo "ERROR: Script debe ejecutarse desde carpeta 'scripts/'"
    echo "Navega a: cd zeker/scripts"
    exit 1
fi

# Hacer scripts ejecutables
chmod +x setup-gcp.sh setup-firestore-rules.sh get-firebase-config.sh

echo "Ejecutando setup en orden..."
echo ""

# Script 1
echo "▶ Script 1/3: setup-gcp.sh"
echo "─────────────────────────────────────────────────────────────"
./setup-gcp.sh
echo ""
echo "✓ Script 1 completado"
echo ""
read -p "Presiona ENTER para continuar con Script 2"
echo ""

# Script 2
echo "▶ Script 2/3: setup-firestore-rules.sh"
echo "─────────────────────────────────────────────────────────────"
./setup-firestore-rules.sh
echo ""
echo "✓ Script 2 completado"
echo ""
read -p "Presiona ENTER para continuar con Script 3"
echo ""

# Script 3
echo "▶ Script 3/3: get-firebase-config.sh"
echo "─────────────────────────────────────────────────────────────"
./get-firebase-config.sh
echo ""
echo "✓ Script 3 completado"
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  SETUP COMPLETADO                                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "PRÓXIMOS PASOS:"
echo "1. Ve a Firebase Console (link arriba)"
echo "2. Copia los 6 valores (apiKey, authDomain, etc.)"
echo "3. Pega en .env.example (ahora en raíz de zeker/)"
echo "4. Confirma cuando esté listo"
echo ""
