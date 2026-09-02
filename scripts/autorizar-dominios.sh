#!/usr/bin/env bash
#
# Autoriza las direcciones de Zeker en el sistema de acceso (Firebase Auth).
#
# Esta es una lista DISTINTA de la de la llave del navegador, y son dos
# permisos independientes que se parecen mucho:
#
#   * La llave (`arreglar-llave.sh`) decide desde qué dirección se puede
#     *llamar* a Google.
#   * Esta lista decide a qué dirección se le permite *regresar* a la persona
#     después de crear su contraseña.
#
# Cuando alguien pide una contraseña, la pantalla le dice a Firebase a dónde
# devolverlo. Si esa dirección no está en esta lista, Firebase rechaza la
# petición entera con "Domain not allowlisted by project" y no envía nada.
#
# Hasta el 2026-09-02 esta lista solo tenía `localhost` y los dos dominios que
# Firebase crea solo — ninguna de las dos direcciones reales del producto. Por
# eso ninguna invitación y ninguna recuperación salió nunca desde la aplicación.
#
# ⚠️ Una prueba con un correo inventado NO sirve para verificar esto: cuando la
# cuenta no existe, Firebase responde "listo" sin revisar la dirección de
# regreso, para no delatar quién tiene cuenta. La única prueba real es un correo
# de verdad, a una cuenta de verdad.
#
#   bash scripts/autorizar-dominios.sh
#
set -euo pipefail

PROJECT="zeker-505918"

# Las dos direcciones en las que Cloud Run responde con el producto, más las
# que Firebase necesita para su propia página de contraseñas. `zeker.com.co`
# NO entra todavía: está comprado pero no resuelve, y autorizar una dirección
# que no existe fue la condición que Seguridad puso por escrito el 2026-09-02.
DOMINIOS='[
  "localhost",
  "zeker-505918.firebaseapp.com",
  "zeker-505918.web.app",
  "zeker-web-krsxkgch7q-uc.a.run.app",
  "zeker-web-880033266233.us-central1.run.app"
]'

TOKEN="$(gcloud auth print-access-token)"
API="https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT}/config"

mostrar_lista() {
  curl -s "${API}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "x-goog-user-project: ${PROJECT}" \
  | python -c '
import json, sys
datos = json.load(sys.stdin)
if "error" in datos:
    print("  ERROR:", datos["error"].get("message"))
    sys.exit(1)
for dominio in datos.get("authorizedDomains", []):
    print("  -", dominio)
'
}

echo "== Direcciones autorizadas hoy"
mostrar_lista

echo ""
echo "== Agregando las dos direcciones del producto"
curl -s -X PATCH "${API}?updateMask=authorizedDomains" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "x-goog-user-project: ${PROJECT}" \
  -H "Content-Type: application/json" \
  -d "{\"authorizedDomains\": ${DOMINIOS}}" \
  > /dev/null

echo ""
echo "== Como quedo"
mostrar_lista

echo ""
echo "== La prueba"
echo "   Esta lista solo se puede comprobar de verdad con un correo real."
echo "   Pida el enlace desde la aplicacion y abralo. Si llega, quedo bien."
