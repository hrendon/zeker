# Revisión Semanal Zeker — 2026-09-04

**Segunda ocurrencia.** La anterior fue el 2026-09-01
(`2026-09-01-revision-semanal.md`).

**Convocada por:** Project Manager / Scrum Master (sin titular — la convoca la
sesión).
**Roles presentes:** Product Owner, Software Architect, Security Engineer / CISO,
QA Engineer, Customer Discovery & Validation Advisor, FP&A Manager, Residential
Property Administration Consultant, Physical Security Consultant.
**Ausentes y relevantes:** Content Strategist / Copywriter (le queda una pregunta
de texto abierta más abajo, y no fue consultado esta vez tampoco — segunda vez
seguida), UI/UX Designer, Interface & Experience Auditor.
**Leído:** `PROJECT_STATE.md`, `product/brief.md`, `business/budget.md`,
`business/risks.md`, `delivery/manual-test-cases.md`, `decisions/016`, y la
cuenta de facturación en vivo.

**Atrasada, y hay que decirlo.** La Decisión 013 dice que esta reunión corre
*"cada vez que se cierra una unidad"*. Se cerraron tres el 2026-09-03 y una hoy
—cuatro— con una sola revisión de por medio. **No es que se haya saltado una
vez: es que la regla no se está cumpliendo**, y una cadencia que se incumple en
silencio es indistinguible de una que nunca se adoptó.

---

## Lo que pasó desde el 2026-09-01

**Tres unidades el 03, una hoy.** Las de anteayer están en el registro de esa
sesión. La de hoy:

* **El documento de mercado se reescribió** para el segmento que el Fundador
  eligió el 2026-08-31. Llevaba cuatro días argumentando colegios. Ahora cada
  afirmación está marcada como hecho, opinión de experto o suposición — y **no
  hay una cuarta marca, porque no hay ni una sola evidencia de cliente**.
* **Decisión 016**: un permiso puede llevar días de la semana y una franja de
  horas, leídas en el reloj del edificio. Construida, publicada y **corrida a
  mano contra producción**, los ocho pasos.

## Decisiones

* **D-009, del Fundador: construir antes de hablar.** Se le presentaron tres
  caminos con la recomendación de hablar primero con cinco administradores. Eligió
  construir. **La recomendación quedó escrita al lado, sin borrar.** Registrado
  en `PROJECT_STATE.md` y en la Decisión 016.
* **La regla de limpieza del almacén de imágenes se aplica hoy**, conservando tres
  versiones por servicio. Aprobada por el Fundador después de ver la lista exacta
  de lo que se borraría.
* **No se cambia el mensaje "no sirve a esta hora"** todavía. Es una pregunta de
  texto, va a Content, y cambiar texto de portería sin su dueño es cómo se
  degradan los mensajes que importan.

## Hallazgos

* **La afirmación de los dos consultores era medio falsa, y comprobarla contra el
  código antes de construir ahorró semanas.** Ambos leyeron la Decisión 007 y
  ninguno vio la 014, de dos días antes. La recurrencia ya existía casi entera;
  lo que faltaba era el horario. → `decisions/016`, `risks.md` R-08.
  **La lección general no es sobre estos dos roles.** Es que **una opinión de
  experto sobre el propio producto se verifica contra el código antes de actuar**,
  igual que se verifica una infraestructura declarada contra la infraestructura
  viva.
* **La cuenta de facturación está en pesos colombianos.** Cierra un riesgo real:
  se temía que estuviera en dólares, y escribir "20000" habría creado un techo de
  veinte mil dólares que nunca avisa nada. → `budget.md`.
* **La alerta de presupuesto sigue sin existir.** La función con la que se crean
  nunca se ha activado en este proyecto. Dieciséis días. → `budget.md`, y es de
  las manos del Fundador.
* **El almacén de imágenes pasó del 27% al 53% en tres días**, todo con nuestras
  propias publicaciones y cero clientes. Sería el primer cobro de Google en la
  vida del proyecto, por guardar imágenes que nadie ejecuta. → R-32.
* **La regla de limpieza quedó puesta y todavía no ha borrado nada.** Quinta
  aparición de la misma forma: declarado ≠ corriendo. Esta vez está escrito antes
  de que alguien lo dé por hecho, con su comprobación pendiente para la próxima
  sesión. → R-32, R-16.
* **Un permiso viejo no tiene el campo del horario en absoluto** — no en `null`,
  ausente. Leído directo de la base de datos, no supuesto. Contestó con su regla
  vieja en la portería. → `manual-test-cases.md`.
* **Cuando el día es el equivocado, la portería dice "no sirve a esta hora".** Un
  vigilante de afán puede mirar el reloj en vez del calendario. → Content
  Strategist.
* **Dos de tres verificaciones necesitaron un segundo toque.** Puede ser la
  automatización y no el producto; no se distingue desde aquí. → QA, se resuelve
  con un dedo real en TC-PHONE-01.

## Riesgos

* **R-32, nuevo** — el almacén de imágenes se llena solo con nuestras propias
  publicaciones. Mitigado hoy, sin comprobar.
* **R-29, R-30, R-31, del 2026-09-04 por la mañana** — el vigilante no trabaja
  para quien compra; el contrato de vigilancia puede ya ser dueño del registro; y
  "solo entradas, nunca salidas" rompe cosas concretas en el extremo corporativo.
  **Ninguno probado con nadie.**
* **R-08 se estrechó, no se cerró.** El producto ya puede expresar al visitante
  que se repite. **Que sea la forma que un edificio quiere sigue sin comprobarse**,
  y descansa sobre A5, que tampoco.

## Bloqueos escalados

* **Nada bloquea el trabajo técnico.** Lo que está bloqueado es el negocio, y no
  por una dependencia: por horas del Fundador que nadie más puede poner. Diecisiete
  días, cero conversaciones.
* **El crédito de US$300 vence el 2026-11-17** y es compartido. Setenta y cuatro
  días. Hasta entonces cada "US$0.00" no prueba nada.

## Aparcado

* La política de retención de permisos (`data-minimization.md` promete un año en
  los anulados; nada lo implementa). Vuelve en la siguiente semanal — **es la
  segunda vez que se aparca**.
* Los ejemplos de colegio en `data-minimization.md`. De Security Engineer.
* Horas distintas por día, y horarios que cruzan la medianoche. **No se construyen
  hasta que un administrador los pida** — que es exactamente el error que casi se
  comete hoy.
* Qué trae un plan pagado y cuánto cuesta. Su dueño es un rol inactivo.

## Acuerdos

* **La comprobación de la limpieza entra en el cierre de la próxima sesión**, con
  su línea de pasa/falla escrita hoy: cerca de 150 MB y seis imágenes es pasa;
  300 MB y catorce es falla.
* **Ninguna conversación con un administrador cuenta si la persona no puede
  comprar.** Registrada aparte, en `customer-discovery.md`.
* **El producto no se describe antes de la primera pregunta** en una conversación
  de descubrimiento. Quien ya vio una solución contesta sobre la solución.

## La lista ordenada — 2026-09-04

Reemplaza la del 2026-09-01, que quedó consumida. **Y** = solo el Fundador.

### Lo que decide si algo de esto importa

| # | Qué | Quién | Por qué está de primero |
|---|---|---|---|
| 1 | **Cinco a ocho conversaciones con administradores de conjuntos.** El guion, el orden y qué cuenta como "no" ya están escritos | **Y** | Diecisiete días construyendo, cero conversaciones. Es lo único que puede decir si el producto sirve para algo, y hoy hay algo concreto que mostrar |

### Esta semana, por el dinero, que tiene fecha

| # | Qué | Quién | Nota |
|---|---|---|---|
| 2 | **Leer el informe de facturación agrupado por producto, con la columna de créditos** | **Y** | Lo único que separa "está dentro de lo gratis" de "se cobró y el crédito lo tapó". Minutos |
| 3 | **Crear la alerta en la CUENTA de facturación, no en el proyecto.** Umbral 25% | **Y** | ✅ Ya sabemos que la cuenta está en pesos: el monto es **20.000**, el aviso en **5.000**. La duda que bloqueaba esto está resuelta |
| 4 | Cloudflare → Añadir sitio → `zeker.com.co` | **Y** | Comprado y sin resolver desde el 1 de septiembre |
| 5 | Los cinco controles del dominio, en una sentada | **Y** | R-20 sigue abierto hasta que exista un recordatorio fuera de este repositorio |

### Lo que hago yo

| # | Qué | Depende de |
|---|---|---|
| 6 | **Comprobar que la limpieza borró de verdad** | Que pase un día |
| 7 | Quitar la llave de cifrado sin uso (la Decisión 005 la dejó sin propósito) | 2 |
| 8 | La pregunta de texto de la portería: distinguir el día de la hora | Content Strategist |
| 9 | El texto "Este permiso ya terminó" en un permiso usado — se lee como vencido | Content Strategist |
| 10 | Distinguir a simple vista la cuenta de un responsable de la de un administrador | Observación del Fundador, 2026-09-03 |
| 11 | Limitar cuántas personas se pueden crear por organización | — |
| 12 | Nuestra propia página de `/auth/action` | — |

### Las manos del Fundador sobre esta máquina

Sin cambios desde el 2026-09-02. Cinco acciones, R-23 y R-24, todas suyas.

## Alineación

El producto hace más de lo que hacía el lunes y el documento que lo vende por fin
dice la verdad. **Lo que no cambió en diecisiete días es lo único que decide si
algo de esto sirve:** nadie del mercado ha hablado con nosotros. Hoy eso tiene un
archivo donde caer y un guion escrito de antemano. Lo que le falta son horas del
Fundador, y ninguna cantidad de código las reemplaza.
