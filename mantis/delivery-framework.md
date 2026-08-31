# Marco de Gestión de Desarrollo, QA y Despliegue a Producción

Extensión del AI Software Development Operating Framework (`mantis.md`).

Donde el marco base define cómo se razona y se preserva el conocimiento, este define cómo fluye el trabajo desde una tarea hasta producción y qué debe cumplirse en cada frontera antes de avanzar.

---

# 1. Propósito y relación con el marco base

Este marco extiende el marco base (`mantis.md`) y reutiliza sus mecanismos: clasificación de conocimiento (FACT / DECISION / ASSUMPTION / PROPOSAL / UNKNOWN), capas de memoria (L1–L4), protocolo de promoción de conocimiento y ciclo de vida. También reutiliza el marco de roles (`roles.md`), que define quién ostenta cada autoridad de aprobación mencionada en este documento.

Las fases del ciclo de vida base BUILD → VERIFY → RELEASE → OPERATE se detallan aquí como un flujo gobernado por gates. Toda promoción de conocimiento (Sección 10 del marco base) sigue aplicando en cada transición.

Contexto de este proyecto, fijado como DECISION:

* El control de versiones se basa en ramas y pull requests.
* El despliegue a producción es automático (continuous deployment), gobernado por gates automáticos.
* Existe una salvaguarda innegociable contra la destrucción de datos en producción (Sección 8). Esta salvaguarda tiene autoridad L1 y prevalece sobre la automatización.

---

# 2. Modelo de ramas

El trabajo se organiza en ramas. La estrategia concreta (trunk-based o basada en ramas de feature de vida corta) se registra como DECISION en `branching-strategy.md`. Independientemente de la variante elegida, aplican estas reglas:

* Existe una rama principal que representa el estado desplegable. Debe permanecer siempre en verde (build y pruebas pasando).
* El trabajo se realiza en ramas de corta duración derivadas de la principal, asociadas a un elemento de trabajo.
* La integración a la rama principal ocurre exclusivamente vía pull request, nunca por push directo.
* Cada merge a la rama principal es un candidato a despliegue: dispara el pipeline que puede llevar el artefacto hasta producción.
* Las ramas de larga duración se evitan; si existen (p. ej. una rama de release), su propósito y ciclo de vida se registran como DECISION.

---

# 3. Flujo de estados del trabajo

Todo elemento de trabajo (feature, bug, mejora técnica) avanza por estados explícitos. Un elemento no avanza hasta cumplir el gate de salida correspondiente.

```text
BACKLOG → READY → IN_PROGRESS → IN_REVIEW → MERGED
        → PIPELINE → DEPLOYED_TO_PROD → VERIFIED_IN_PROD → CLOSED
```

Estados de excepción:

* BLOCKED — bloqueado, con causa registrada.
* REJECTED — devuelto en revisión, con motivo.
* PIPELINE_FAILED — el pipeline detuvo la promoción; el merge no llegó a producción.
* ROLLED_BACK — revertido de producción, con incidente asociado.

Como el despliegue es automático, no existe un estado manual de "listo para desplegar": una vez que un cambio se integra (`MERGED`), el pipeline decide su avance según los gates automáticos. La intervención humana ocurre antes del merge (revisión) y después del despliegue (verificación e incidentes), no como un botón de release.

El estado vigente de cada elemento es conocimiento L4. Al cerrarse, su historial relevante se promueve a L3.

`execution.md` operacionaliza el estado `IN_PROGRESS` con un ciclo de unidad concreto (elegir, entender, planificar, implementar, verificar, actualizar estado, checkpoint) — no introduce un flujo de estados paralelo.

---

# 4. Gates de transición

Cada gate es una condición de salida verificable. Ningún gate se declara cumplido sin evidencia real, coherente con la regla del marco base de nunca afirmar verificación que no ocurrió. Con despliegue automático, la mayoría de los gates posteriores al merge son automáticos y bloqueantes: si no se cumplen, el pipeline se detiene.

## Gate de READY (Definition of Ready)

Objetivo claro; criterios de aceptación definidos; restricciones arquitectónicas y decisiones relevantes resueltas; implicaciones de seguridad identificadas; enfoque de verificación acordado; impacto sobre datos identificado (si toca esquemas o datos de producción, ver Sección 8).

## Gate de IN_PROGRESS → IN_REVIEW

Implementación completa; estándares de código respetados; pruebas unitarias correspondientes escritas y ejecutadas; el pipeline de la rama en verde; migraciones (si las hay) marcadas y revisadas contra la política de datos.

## Gate de IN_REVIEW → MERGED (gate humano)

Revisión de código aprobada por al menos un revisor distinto del autor; comentarios resueltos o registrados como deuda; análisis estático sin hallazgos bloqueantes; toda migración que altere o elimine datos revisada explícitamente contra la Sección 8. Este es el principal punto de control humano del flujo automático.

**Aprobación de seguridad para la rama principal.** Ningún merge a la rama principal se ejecuta sin la aprobación explícita del rol de seguridad activo (Security Engineer, o CISO donde exista — `roles.md`), adicional a la revisión de código normal. El push directo a la rama principal ya está prohibido (§2); esta regla cierra el otro camino: un merge sin visto bueno de seguridad no procede, y un agente de IA nunca aprueba seguridad sobre su propio cambio (el implementador nunca es su propio verificador — `execution.md` §4). Esta regla se hace efectiva con protección de rama y CODEOWNERS en la plataforma de git (p. ej. GitHub branch protection con revisión requerida del equipo de seguridad) — el texto de este marco declara la política; la plataforma la aplica.

**Auditoría de interfaz para cambios de cara al cliente.** Ningún merge que toque la interfaz de cara al cliente procede sin la revisión de Interface & Experience Auditor (`roles.md`, categoría Independent Audit), adicional a la revisión de código normal — mismo principio que la aprobación de seguridad anterior: quien construyó la interfaz no es quien certifica que funciona para un extraño. Aplica solo cuando el cambio toca la interfaz; un cambio puramente de backend no requiere esta revisión.

## Gate de MERGED → PIPELINE

El merge a la rama principal dispara el pipeline automáticamente. La rama principal debe quedar en verde tras integrar.

## Gate de PIPELINE → DEPLOYED_TO_PROD (automático, bloqueante)

Ejecutados con éxito y registrados: build; pruebas unitarias, de integración y de contrato; análisis estático; escaneo de dependencias y de seguridad; pruebas end-to-end y de regresión en un ambiente con paridad de producción; validación de la salvaguarda de datos (Sección 8). Cualquier fallo detiene la promoción y marca el elemento como `PIPELINE_FAILED`. Ningún cambio llega a producción si un solo gate automático falla.

## Gate de VERIFIED_IN_PROD (automático + observación)

Verificación post-despliegue ejecutada (smoke tests, métricas y logs saludables); monitoreo y alertas activos; sin regresiones detectadas dentro de la ventana de observación definida. Si los disparadores de rollback se activan, el sistema revierte (Sección 6) y el elemento pasa a `ROLLED_BACK`.

---

# 5. Ambientes y promoción de artefactos

Cadena de ambientes. Regla base: el mismo artefacto versionado promueve entre ambientes; nunca se reconstruye por ambiente. Lo que cambia por ambiente es la configuración, no el artefacto.

```text
DEV → CI → STAGING (paridad con producción) → PRODUCTION
```

Cada ambiente declara, en `environments.md`: propósito; fuente y naturaleza de los datos; quién o qué puede desplegar; qué gates deben cumplirse para promover; y estrategia de configuración y secretos.

Regla de datos por ambiente: los ambientes distintos de producción no operan sobre datos de producción reales. Si se requieren datos productivos para pruebas, deben estar anonimizados o enmascarados. Ningún flujo automático copia datos desde producción hacia otros ambientes sin una DECISION explícita que lo autorice y describa el enmascaramiento.

---

# 6. Estrategia de despliegue y rollback

La estrategia de despliegue por servicio se registra como DECISION: recreación, rolling, blue-green o canary. Para despliegue automático se prefieren estrategias que permitan reversión rápida y de bajo riesgo (blue-green o canary), de modo que el rollback sea automatizable.

Para cada servicio se define:

* Disparadores de rollback explícitos — qué métricas o condiciones (tasa de error, latencia, fallos de smoke test, alertas) obligan a revertir, y sus umbrales.
* Rollback automatizado del código — el pipeline revierte a la versión anterior cuando se activa un disparador, sin intervención manual.
* Reversibilidad de migraciones — toda migración de datos declara su criterio de reversibilidad. Ver Sección 8: el rollback de código nunca implica restaurar datos destruidos, porque la destrucción de datos de producción está prohibida de entrada.
* Ventana de observación post-despliegue con dueño asignado (humano o automático).

Todo rollback genera un registro en L3 y, si aplica, un incidente en `incident-log/` y una entrada de deuda o bug en L4.

---

# 7. QA como disciplina, no como fase final

Con despliegue automático, QA no puede ser un estado manual al final: es un conjunto de verificaciones incrustadas en el pipeline. Cada requisito significativo declara qué se verifica, cómo, dónde y qué constituye éxito.

Niveles de verificación y dónde vive cada uno:

* En desarrollo: unitarias y de contrato.
* En CI: integración, análisis estático, escaneo de dependencias y seguridad.
* En staging (paridad con producción): end-to-end, regresión, rendimiento cuando aplica, aceptación automatizada.
* En producción: smoke tests y verificación de métricas tras el despliegue.

La cobertura de verificación de un cambio es parte del gate automático de la Sección 4: si las pruebas relevantes no existen o no pasan, el cambio no se despliega.

---

# 8. Salvaguarda de datos de producción (autoridad L1, innegociable)

Esta es la regla de mayor autoridad de este marco. Ninguna automatización, optimización de despliegue ni instrucción de conveniencia la anula. Coherente con las reglas base "nunca fabricar estado del repositorio" y "la preparación para producción es parte de la ingeniería".

Principio: ningún flujo automático puede eliminar, truncar ni sobrescribir de forma destructiva datos existentes en producción.

Reglas concretas:

1. **Prohibición de operaciones destructivas automáticas.** El pipeline nunca ejecuta contra la base de datos de producción operaciones que destruyan datos: `DROP`, `TRUNCATE`, `DELETE` masivo sin cláusula acotada, o eliminación de columnas/tablas con datos, entre otras. Estas operaciones se detectan y bloquean automáticamente.
2. **Migraciones aditivas por defecto (expand/contract).** Los cambios de esquema se hacen en fases: primero expandir (añadir columnas/tablas nuevas, compatibles hacia atrás), migrar y verificar, y solo después considerar contraer. La contracción (eliminar lo viejo) nunca es automática.
3. **La eliminación de datos o estructuras requiere DECISION humana explícita.** Cualquier migración que pueda destruir datos se marca como tal, se detiene en el pipeline, y solo procede con aprobación humana registrada como DECISION, fuera del flujo automático. No hay "auto-aprobación".
4. **Detección obligatoria en el gate de merge y en el pipeline.** Toda migración se analiza en dos puntos: en la revisión (Gate IN_REVIEW → MERGED) y automáticamente en el pipeline (Gate PIPELINE → DEPLOYED_TO_PROD). Si se detecta una operación potencialmente destructiva no aprobada, el pipeline se detiene y el elemento pasa a `PIPELINE_FAILED`.
5. **Respaldo verificado antes de cualquier cambio de esquema.** Antes de aplicar migraciones en producción, existe un respaldo reciente y verificado como restaurable. Un cambio de esquema no procede si no se confirma la existencia del respaldo.
6. **Borrado lógico sobre borrado físico.** Cuando el negocio requiere "eliminar" datos, se prefiere borrado lógico (marcado como inactivo/eliminado) sobre borrado físico. El borrado físico definitivo, si es necesario, es un proceso deliberado y aprobado, nunca un efecto colateral de un despliegue.
7. **Reversibilidad declarada.** Toda migración declara cómo se revierte. Si una migración no es reversible sin pérdida de datos, se trata como operación destructiva y cae bajo la regla 3.

La violación de cualquiera de estas reglas por parte de la automatización es una condición de parada: el despliegue no continúa.

---

# 9. Roles y autoridad de aprobación

Aun con despliegue automático, hay puntos donde la autoridad es humana y debe quedar registrada como DECISION, no asumida. `roles.md` define quién ostenta cada autoridad; `roles/role-registry.md` registra quién la ejerce en este proyecto concreto:

* Aprobación de código (merge): al menos un revisor distinto del autor. Es el principal control humano previo a producción. Recae típicamente en el rol Tech Lead / Lead Developer o Software Architect (`roles.md`).
* Aprobación de operaciones sobre datos: cualquier migración destructiva o eliminación de datos (Sección 8) requiere aprobación humana explícita de un responsable designado. Recae típicamente en el Database Administrator, consultando a Security Engineer o CISO cuando el impacto lo justifica (`roles.md`).
* Definición de disparadores y umbrales de rollback: decisión humana registrada; su ejecución es automática. Recae típicamente en DevOps Engineer.

Cuando una aprobación involucra a más de un rol, se aplica el Protocolo de Comunicación y Debate entre Roles (`roles.md` §7) antes de registrar la DECISION, incluyendo el rol que la posee y las objeciones planteadas.

Todo lo demás en el camino a producción es automático y gobernado por gates.

---

# 10. Artefactos canónicos que añade este marco

Complementan los artefactos del marco base. Se referencia lo canónico; no se duplica.

* `branching-strategy.md` — estrategia de ramas y reglas de merge.
* `pipeline.md` — etapas del pipeline, gates automáticos y condiciones de parada.
* `environments.md` — ambientes, datos, configuración y reglas de promoción.
* `deployment.md` — estrategia de despliegue y rollback por servicio.
* `data-safety.md` — la salvaguarda de datos de producción (Sección 8) y el proceso de aprobación de migraciones destructivas.
* `qa-strategy.md` / `test-plan.md` — niveles de verificación y ubicación.
* `definition-of-ready.md` / `definition-of-done.md` — gates operativos.
* `incident-log/` — incidentes y rollbacks.
* `release-notes/` y `CHANGELOG.md` — historial de lo desplegado.

---

# 11. Métricas de flujo y operación

Rastrear cuando aporten valor, como insumo de decisiones de proceso y no como fin:

* Lead time por elemento (de READY a VERIFIED_IN_PROD).
* Frecuencia de despliegue.
* Tasa de fallo de despliegues (change failure rate).
* Tiempo medio de recuperación (MTTR).
* Tasa de fallo del pipeline por etapa.
* Cobertura de verificación de requisitos críticos.

---

# 12. Continuidad

Coherente con el Principio de Continuidad del marco base. En cualquier momento, desde el repositorio y sin la conversación previa, debe poder responderse:

* Qué se está desplegando y qué versión está en producción.
* En qué estado y ambiente está cada elemento de trabajo.
* Qué gate detuvo un cambio, si el pipeline falló.
* Qué migraciones tocan datos de producción y cuáles requieren aprobación.
* Qué se desplegó, qué se verificó en producción y qué se revirtió.
* Qué queda por resolver.

El test último de continuidad: un nuevo desarrollador o agente de IA debe poder reconstruir el estado del proceso de entrega desde el repositorio y continuar, sin acceso a transcripciones de conversaciones previas.
