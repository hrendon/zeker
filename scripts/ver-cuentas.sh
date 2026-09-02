#!/usr/bin/env bash
#
# ¿Qué cuentas existen realmente, y cuál puede entrar?
#
# Lee las cuentas del sistema de acceso (Firebase Auth) y muestra, de cada una,
# solo lo necesario para responder dos preguntas: con qué correo existe la
# cuenta, y si la contraseña se cambió de verdad.
#
# No muestra contraseñas — Firebase no las entrega, ni siquiera al dueño del
# proyecto. Tampoco escribe nada: este archivo solo lee.
#
# El encabezado `x-goog-user-project` es obligatorio. Con credenciales de una
# persona (no de un servidor), Google exige que la petición diga a qué proyecto
# le cuenta el uso; sin él responde un error que parece de autenticación y no
# lo es. Se descubrió al correr este mismo archivo el 2026-09-02.
#
#   bash scripts/ver-cuentas.sh
#
set -euo pipefail

PROJECT="zeker-505918"

TOKEN="$(gcloud auth print-access-token)"

curl -s -X POST \
  "https://identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:query" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -H "x-goog-user-project: ${PROJECT}" \
  -d '{}' \
| python -c '
import json, sys, datetime

def fecha(ms):
    if not ms:
        return "nunca"
    momento = datetime.datetime.fromtimestamp(int(ms) / 1000, datetime.timezone.utc)
    return momento.strftime("%Y-%m-%d %H:%M UTC")

datos = json.load(sys.stdin)

if "error" in datos:
    print("ERROR:", datos["error"].get("message"))
    sys.exit(1)

cuentas = datos.get("userInfo", []) or []
print("Cuentas en el sistema de acceso:", len(cuentas))

for cuenta in cuentas:
    print("")
    print("  correo              :", cuenta.get("email"))
    print("  cuenta creada       :", fecha(cuenta.get("createdAt")))
    print("  ultima vez que entro:", fecha(cuenta.get("lastLoginAt")))
    print("  contrasena cambiada :", fecha(cuenta.get("passwordUpdatedAt")))
    print("  tiene contrasena    :", "si" if cuenta.get("passwordHash") else "NO")
    print("  deshabilitada       :", "SI" if cuenta.get("disabled") else "no")
'
