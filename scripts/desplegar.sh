#!/usr/bin/env bash
#
# Publica lo que está en el repositorio, para que se pueda probar de verdad.
#
# Sube los dos servicios a Cloud Run: la API y la aplicación. Cada uno se
# construye dentro de Google (`--source .`), así que no hace falta tener nada
# instalado aquí más allá de gcloud.
#
# ⚠️ Esto cambia lo que ven los usuarios. No es una prueba: es publicar.
#
# Antes de correrlo, las pruebas deben estar en verde:
#   cd backend && npm test
#   cd frontend && npm test && npm run typecheck
#
#   bash scripts/desplegar.sh          # los dos
#   bash scripts/desplegar.sh api      # solo la API
#   bash scripts/desplegar.sh web      # solo la aplicación
#
set -euo pipefail

PROJECT="zeker-505918"
REGION="us-central1"
QUE="${1:-todo}"

if [ "${QUE}" = "todo" ] || [ "${QUE}" = "api" ]; then
  echo "== Publicando la API"
  (
    cd backend
    gcloud run deploy zeker-api \
      --source . \
      --region "${REGION}" \
      --project "${PROJECT}" \
      --service-account "zeker-backend@${PROJECT}.iam.gserviceaccount.com" \
      --set-env-vars "NODE_ENV=production,GCP_PROJECT_ID=${PROJECT}"
  )
fi

if [ "${QUE}" = "todo" ] || [ "${QUE}" = "web" ]; then
  echo ""
  echo "== Publicando la aplicación"
  # frontend/.env.production está versionado a propósito: Next.js compila esos
  # valores dentro de la imagen. Si faltara, el sitio se publica sin errores y
  # no deja entrar a nadie. Ver el comentario en .gitignore.
  (
    cd frontend
    gcloud run deploy zeker-web \
      --source . \
      --region "${REGION}" \
      --project "${PROJECT}" \
      --service-account "zeker-web@${PROJECT}.iam.gserviceaccount.com" \
      --allow-unauthenticated
  )
fi

echo ""
echo "== Publicado"
echo "   https://zeker-web-krsxkgch7q-uc.a.run.app"
echo ""
echo "   Verifíquelo a mano. Las pruebas no vieron nunca la puerta cerrada"
echo "   que estuvo cerrada dos dias (R-19, R-26)."
