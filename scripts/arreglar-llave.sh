#!/usr/bin/env bash
#
# Autoriza las direcciones desde las que se puede entrar a Zeker.
#
# El producto responde en dos direcciones de Cloud Run — la canónica, que es la
# que muestra la consola y la que una persona guarda en favoritos, y la del
# número de proyecto. Solo la segunda estaba autorizada, así que desde la
# primera fallaba todo: entrar, y pedir una contraseña nueva.
#
# La tercera dirección es la página de contraseñas de Firebase. Sale de esta
# lista el día que tengamos nuestra propia página de recuperación.
#
# La restricción NO se afloja: las tres direcciones son nuestras. Lo que se
# corrige es que estaba incompleta.
#
#   bash scripts/arreglar-llave.sh
#
set -euo pipefail

LLAVE="projects/880033266233/locations/global/keys/22180854-c084-41a2-ab6c-df3ba4d97cd1"

APP_CANONICA="https://zeker-web-krsxkgch7q-uc.a.run.app/*"
APP_NUMERO="https://zeker-web-880033266233.us-central1.run.app/*"
PAGINA_FIREBASE="https://zeker-505918.firebaseapp.com/*"

echo "== Como esta hoy"
gcloud services api-keys describe "${LLAVE}" \
  --format="value(restrictions.browserKeyRestrictions.allowedReferrers)"

echo ""
echo "== Guardando copia de seguridad de la configuracion actual"
mkdir -p docs/security/api-key-snapshots
gcloud services api-keys describe "${LLAVE}" --format=json \
  > "docs/security/api-key-snapshots/$(date +%Y-%m-%d)-antes-de-agregar-canonica.json"

echo ""
echo "== Aplicando el cambio"
gcloud services api-keys update "${LLAVE}" \
  --allowed-referrers="${APP_NUMERO},${APP_CANONICA},${PAGINA_FIREBASE}" \
  --format="value(name)" > /dev/null

echo ""
echo "== Como quedo"
gcloud services api-keys describe "${LLAVE}" \
  --format="value(restrictions.browserKeyRestrictions.allowedReferrers)"

echo ""
echo "== La prueba: la misma pregunta a Google desde cada direccion"
echo "   Se espera 400 (la llave sirve, el codigo de prueba es falso) en las tres."
echo "   Un 403 significa que esa direccion sigue bloqueada."
echo ""

CLAVE="$(grep NEXT_PUBLIC_FIREBASE_API_KEY frontend/.env.production | cut -d= -f2 | tr -d '\r')"

for ORIGEN in \
  "https://zeker-web-880033266233.us-central1.run.app/entrar" \
  "https://zeker-web-krsxkgch7q-uc.a.run.app/entrar" \
  "https://zeker-505918.firebaseapp.com/__/auth/action"
do
  RESPUESTA="$(curl -s -X POST \
    "https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${CLAVE}" \
    -H "Content-Type: application/json" \
    -H "Referer: ${ORIGEN}" \
    -d '{"oobCode":"PRUEBA"}')"

  if echo "${RESPUESTA}" | grep -q "INVALID_OOB_CODE"; then
    echo "  OK   400  ${ORIGEN}"
  elif echo "${RESPUESTA}" | grep -q "are blocked"; then
    echo "  MAL  403  ${ORIGEN}  <-- sigue bloqueada"
  else
    echo "  ???       ${ORIGEN}"
    echo "${RESPUESTA}" | head -c 200
  fi
done
