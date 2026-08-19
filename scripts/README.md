# Scripts de Setup — Zeker

Automatización de configuración en GCP y Firebase.

## Archivos

- **run-all.ps1** — Ejecuta todos los scripts en orden (RECOMENDADO)
- **setup-gcp.ps1** — Crea Firestore, KMS, Service Account
- **setup-firestore-rules.ps1** — Aplica security rules
- **get-firebase-config.ps1** — Genera template .env

## Cómo Ejecutar

### Opción A: Run All (TODO de una vez)

```powershell
# Abre PowerShell
# Navega a carpeta scripts
cd C:\Users\hdrah\Documents\zeker\scripts

# Ejecuta script master
.\run-all.ps1

# Te pide ENTER entre cada script
# Al final, sigue instrucciones en pantalla
```

### Opción B: Individual (paso a paso)

```powershell
cd C:\Users\hdrah\Documents\zeker\scripts

.\setup-gcp.ps1              # Crea servicios (~2-3 min)
.\setup-firestore-rules.ps1  # Aplica reglas (~30 seg)
.\get-firebase-config.ps1    # Genera .env template (~5 seg)
```

## Qué Hace Cada Script

### 1. setup-gcp.ps1

✅ Habilita APIs necesarias
✅ Crea Firestore Database
✅ Crea Cloud KMS Key Ring + Key
✅ Crea Service Account
✅ Asigna permisos necesarios

**Tiempo:** ~2-3 minutos

**Output:** Muestra PROJECT_ID, Service Account email, Storage Bucket

### 2. setup-firestore-rules.ps1

✅ Crea archivo de security rules
✅ Aplica a Firestore Database
✅ Limpia archivos temporales

**Tiempo:** ~30 segundos

**Output:** Confirmación de rules aplicadas

### 3. get-firebase-config.ps1

✅ Genera `.env.example` en raíz de proyecto
✅ Muestra instrucciones para obtener Firebase config
✅ Explica qué valores copiar

**Tiempo:** ~5 segundos

**Output:** `.env.example` con template

## Después de Ejecutar

### 1. Obtén Firebase Config

```
Abre: https://console.firebase.google.com/project/zeker-505918/settings/general

Scroll hasta "Firebase SDK snippet"

Copia estos valores:
- apiKey
- authDomain
- projectId
- storageBucket
- messagingSenderId
- appId
```

### 2. Pega en .env Files

**Para backend/** (crear archivo `.env`):
```
GCP_PROJECT_ID=zeker-505918
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=zeker-505918.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=zeker-505918
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=zeker-505918.appspot.com
```

**Para frontend/** (crear archivo `.env.local`):
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=zeker-505918.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=zeker-505918
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=zeker-505918.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123...
NEXT_PUBLIC_FIREBASE_APP_ID=1:123...
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Confirma

Una vez tengas .env files configurados, di en chat:

```
✅ setup-gcp.ps1 ejecutado
✅ setup-firestore-rules.ps1 ejecutado
✅ Firebase config copiado a .env files
```

Yo genero backend + frontend listos para usar.

## Troubleshooting

### Error: "gcloud command not found"

```
gcloud CLI no está instalado o no en PATH
Instala: https://cloud.google.com/sdk/docs/install
```

### Error: "Organization Policy blocks service account key creation"

```
Este es NORMAL. No necesitamos key JSON.
Los scripts usan Application Default Credentials (ADC).
Continuamos sin problema.
```

### Error: "Firestore Database already exists"

```
Es OK. Script intenta crear, pero si ya existe, continúa.
```

### Error: "Permission denied"

```
Ejecuta PowerShell como Admin:
- Click derecho en PowerShell
- "Run as Administrator"
```

## Support

Si algo falla:
1. Copia el mensaje de error
2. Dime qué script falló
3. Paso a paso, lo resolvemos

---

**Autor:** Claude (AI-assisted)  
**Fecha:** 2026-08-18  
**Proyecto:** Zeker MVP
