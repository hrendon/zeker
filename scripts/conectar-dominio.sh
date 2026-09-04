#!/usr/bin/env bash
#
# Conecta zeker.com.co al producto (Decisión 017).
#
#   bash scripts/conectar-dominio.sh
#
# NO corra esto todavía si el dominio no tiene servidores de nombres. El script
# lo comprueba solo y se detiene diciéndolo, en vez de fallar a la mitad.
#
# Antes de correrlo, en Cloudflare:
#
#   1. Websites → Add a site → zeker.com.co → plan Free.
#   2. Cloudflare le da dos servidores de nombres. Como el dominio está comprado
#      en Cloudflare Registrar, la delegación se hace sola: solo hay que esperar.
#   3. Cuando el dominio ya resuelva, corra este script. Le va a decir qué
#      registros DNS crear.
#
# ⚠️ LA NUBE GRIS, NO LA NARANJA.
#
# Cada registro que cree en Cloudflare tiene un icono de nube. Tiene que quedar
# GRIS ("DNS only"). Si queda NARANJA (proxy), Cloudflare responde por nosotros,
# Google nunca puede validar el dominio y el certificado NUNCA se emite — y no
# sale ningún error: el mapeo se queda "pendiente" para siempre mientras el sitio
# parece funcionar. Es la única forma en que esto se rompe en silencio.
#
set -euo pipefail

PROJECT="zeker-505918"
REGION="us-central1"
DOMINIO="zeker.com.co"
DOMINIO_API="api.zeker.com.co"

echo "== 1. ¿El dominio ya tiene servidores de nombres?"
#
# `nslookup` devuelve éxito aunque no encuentre nada, así que preguntarle al
# código de salida no sirve — probado el 2026-09-04: dijo que sí sobre un
# dominio inexistente. Hay que leer lo que contesta.
#
RESPUESTA_DNS="$(nslookup -type=NS "${DOMINIO}" 8.8.8.8 2>&1 || true)"
if echo "${RESPUESTA_DNS}" | grep -qi "can.t find\|NXDOMAIN\|Non-existent"; then
  echo
  echo "  ✋ ${DOMINIO} todavía no resuelve."
  echo
  echo "  Falta el paso de Cloudflare: Websites → Add a site → ${DOMINIO} →"
  echo "  plan Free. Como el dominio está comprado en Cloudflare Registrar, la"
  echo "  delegación se hace sola después de eso; solo hay que esperar."
  echo
  echo "  No es una falla del producto ni de la compra."
  echo
  exit 1
fi
echo "  ✅ Resuelve."

echo
echo "== 2. ¿Google acepta que el dominio es suyo?"
#
# Descubierto el 2026-09-04 corriendo este script contra la realidad: Cloud Run
# NO deja conectar un dominio que no esté verificado para la cuenta, y ese paso
# no estaba escrito en ninguna parte. Falla con "The provided domain does not
# appear to be verified for the current account".
#
if [ -z "$(gcloud domains list-user-verified --format='value(id)' 2>/dev/null | grep -x "${DOMINIO}" || true)" ]; then
  echo
  echo "  ✋ ${DOMINIO} todavía no está verificado."
  echo
  echo "  Google exige que usted demuestre que el dominio es suyo antes de"
  echo "  dejarlo conectar. Son sus manos, una sola vez, y sirve para siempre:"
  echo
  echo "    1. Corra:  gcloud domains verify ${DOMINIO}"
  echo "       Abre una página de Google en el navegador."
  echo "    2. Google le va a dar un registro TXT."
  echo "    3. Cree ese TXT en Cloudflare → DNS. (Un TXT no tiene nube; no hay"
  echo "       nada que poner en gris aquí.)"
  echo "    4. Vuelva a la página de Google y pulse verificar."
  echo "    5. Corra este script otra vez."
  echo
  echo "  Verifique ${DOMINIO} a secas. Al verificar el dominio raíz quedan"
  echo "  cubiertos también sus subdominios, así que api.${DOMINIO} no necesita"
  echo "  su propia verificación."
  echo
  exit 1
fi
echo "  ✅ Verificado."

echo
echo "== 3. Creando los mapeos en Cloud Run"
echo "  ${DOMINIO}      → zeker-web"
echo "  ${DOMINIO_API}  → zeker-api"
echo
echo "  Si ya existen, Google lo dice y no pasa nada."

gcloud beta run domain-mappings create \
  --service zeker-web \
  --domain "${DOMINIO}" \
  --region "${REGION}" \
  --project "${PROJECT}" || true

gcloud beta run domain-mappings create \
  --service zeker-api \
  --domain "${DOMINIO_API}" \
  --region "${REGION}" \
  --project "${PROJECT}" || true

echo
echo "== 4. Los registros DNS que hay que crear en Cloudflare"
echo "  Cópielos tal cual. RECUERDE: nube GRIS en todos."
echo
gcloud beta run domain-mappings describe \
  --domain "${DOMINIO}" \
  --region "${REGION}" \
  --project "${PROJECT}" \
  --format="table(status.resourceRecords[].name, status.resourceRecords[].type, status.resourceRecords[].rrdata)" || true

gcloud beta run domain-mappings describe \
  --domain "${DOMINIO_API}" \
  --region "${REGION}" \
  --project "${PROJECT}" \
  --format="table(status.resourceRecords[].name, status.resourceRecords[].type, status.resourceRecords[].rrdata)" || true

echo
echo "== 5. Lo que falta, y no lo hace este script"
echo
echo "  Después de crear los registros y de que el certificado quede listo,"
echo "  hay TRES listas que también tienen que aprender la dirección nueva."
echo "  Si falta cualquiera de las tres, el producto se rompe — ya pasó dos veces:"
echo
echo "  a) CORS_ORIGINS en scripts/desplegar.sh, y volver a publicar."
echo "     Una publicación reemplaza TODO el entorno: lo que no está en ese"
echo "     archivo, no existe. (R-28)"
echo
echo "  b) bash scripts/arreglar-llave.sh   — los referrers de la llave del"
echo "     navegador. Sin esto, entrar y recuperar contraseña fallan. (R-25)"
echo
echo "  c) bash scripts/autorizar-dominios.sh   — los dominios autorizados de"
echo "     Firebase. Sin esto NINGUNA invitación ni recuperación sale de la"
echo "     aplicación, y no hay ningún error visible. (R-26)"
echo
echo "  Las tres, en la misma sentada. No 'después'."
echo
echo "== 6. Cómo saber si funcionó"
echo
echo "  gcloud beta run domain-mappings describe --domain ${DOMINIO} \\"
echo "    --region ${REGION} --project ${PROJECT}"
echo
echo "  PASA: el certificado aparece listo y https://${DOMINIO} abre el producto"
echo "        desde un teléfono con datos, fuera de esta máquina."
echo "  FALLA: se queda en 'pendiente'. Lo PRIMERO que hay que revisar entonces"
echo "        es si alguna nube quedó naranja en Cloudflare."
