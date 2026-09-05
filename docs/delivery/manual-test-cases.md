# Pruebas a mano

Las pruebas que una persona corre con las manos, en un navegador o un teléfono
de verdad, contra lo que está publicado.

**Por qué existe este archivo.** Tres veces en este proyecto la suite de pruebas
estuvo en verde mientras el producto estaba roto, y las tres veces la falla vivía
justo donde ninguna prueba automática mira: en un permiso de Google, en una lista
de dominios, en la pantalla que ve un extraño. Las pruebas automáticas viven en el
repositorio; estas viven aquí porque nadie más las va a recordar.

**Regla.** *Una prueba sin línea de "pasa / falla" es una demostración, no una
prueba.* Cada paso de abajo dice, escrito de antemano, qué cuenta como pasar y qué
cuenta como fallar. Escribirlo después de ver el resultado no vale.

**Regla.** Se corre contra lo **publicado**, no contra la máquina de desarrollo.
Antes de empezar, anote qué revisión está viva.

| Caso | Qué prueba | Estado |
|---|---|---|
| TC-014-01 | Un permiso de una sola entrada se gasta al usarse | ✅ pasó 2026-09-03 |
| TC-014-02 | Un permiso de entradas libres sigue sirviendo | ✅ pasó 2026-09-03 |
| TC-014-03 | Los permisos viejos no cambiaron de regla | ✅ pasó 2026-09-03 |
| TC-015-01 | Un permiso quemado por error se devuelve | ✅ pasó 2026-09-03 |
| TC-HIST-01 | El historial, y sobre todo quién NO lo ve | ✅ pasó 2026-09-03 (el paso D, por prueba y no a mano) |
| TC-016-01 | Un permiso con días y horas: sirve dentro, no sirve fuera | ✅ pasó 2026-09-04, los ocho pasos |
| TC-016-02 | Los permisos sin horario siguen sirviendo a cualquier hora | ✅ pasó 2026-09-04 |
| TC-018-01 | Un edificio nuevo no puede agregar gente hasta que alguien lo apruebe | ✅ pasó 2026-09-04, los seis pasos |
| TC-018-02 | Los edificios que ya existían no cambiaron | ✅ pasó 2026-09-04 |
| TC-AUTH-RESET-01 | Recuperar la contraseña, de punta a punta | ✅ pasó 2026-09-02, a mano, por el Fundador |
| TC-PHONE-01 | El producto en un teléfono real, afuera, con datos | ⬜ nunca corrido |

> TC-AUTH-RESET-01 y TC-PHONE-01 se nombraron el 2026-09-01 y nunca se
> escribieron. Quedan aquí como pendientes reales, no como referencias a un
> documento que no existe.

---

# TC-014-01 — Un permiso de una sola entrada se gasta al usarse

**Qué decisión prueba:** la 014. Quien emite el permiso elige cuántas veces sirve;
el permiso mismo recuerda que se usó; la portería dice "ya se usó" con esas
palabras.

**Por qué importa que sea a mano:** el punto de la decisión es que un permiso deje
de servir. Eso solo se ve cuando una persona pide entrar dos veces.

## Antes de empezar

- Estar dentro de la aplicación como administrador de una organización.
- La organización tiene por lo menos una sede y un interior.
- La revisión publicada es posterior al 2026-09-02. Si es la del 01, la Decisión
  014 no está viva y este caso no aplica todavía.

## Los pasos

**A. Emitir el permiso.** Permisos → crear uno nuevo.

- **Pasa:** la pantalla pregunta **"¿Cuántas veces sirve?"** y ofrece dos
  opciones: *"Una sola entrada"* y *"Entradas libres hasta que venza"*. Cada una
  explica para qué sirve.
- **Falla:** la pregunta no aparece. Entonces lo publicado no trae la 014, o la
  pantalla quedó por fuera.

**B. Elegir "Una sola entrada" y emitirlo.** Abrir el permiso recién creado.

- **Pasa:** el detalle dice **"Una sola entrada"** y, abajo, **"Todavía no se ha
  usado"**.
- **Falla:** no dice ninguna de las dos cosas, o dice que ya se usó.

**C. Ir a portería, elegir la sede y dictar el número del permiso.**

- **Pasa:** contesta que sí, y muestra el nombre del visitante y el interior.
- **Falla:** cualquier rechazo. Es la primera entrada; tiene que servir.

**D. Volver a dictar el mismo número, en la misma sede.**

- **Pasa:** rechaza, con estas palabras: **"Este permiso era para una sola entrada
  y ya se usó. Pídale al residente que haga uno nuevo."**
- **Falla A:** vuelve a decir que sí. Entonces la decisión completa es adorno.
- **Falla B:** rechaza con un mensaje genérico o en inglés. El portero tiene que
  poder explicarle a la persona que tiene enfrente por qué no entra.

**E. Abrir otra vez el detalle del permiso.**

- **Pasa:** el estado dice **"Ya se usó"**, y aparece la línea **"Entró el"** con
  la fecha y la hora de la entrada del paso C.
- **Falla:** sigue diciendo "Todavía no se ha usado". El permiso no recordó nada.

**F. Ver la lista de permisos.**

- **Pasa:** ese permiso aparece marcado **"Ya se usó"**, sin abrirlo.
- **Falla:** aparece como activo. Quien emite no puede saber qué pasó sin entrar
  uno por uno.

## Qué anotar

Fecha, revisión publicada, quién lo corrió, y el resultado de cada paso. Una foto
de la pantalla del paso D es la evidencia más útil: es la única que un extraño
entiende sin explicación.

---

# TC-014-02 — Un permiso de entradas libres sigue sirviendo

Se corre inmediatamente después del anterior, con las mismas condiciones.

**A. Emitir un permiso eligiendo "Entradas libres hasta que venza".**

**B. Dictarlo en portería dos veces seguidas.**

- **Pasa:** las dos veces contesta que sí.
- **Falla:** la segunda lo rechaza. Los dos tipos de permiso se confundieron, y el
  caso de la empleada doméstica o el técnico queda roto.

**C. Abrir el detalle.**

- **Pasa:** dice **"Entradas libres hasta que venza"**, y la línea de uso muestra
  **"Entró el ... · Entradas registradas: 2"**.
- **Falla:** no cuenta la segunda entrada, o dice que se gastó.

---

# TC-014-03 — Los permisos viejos no cambiaron de regla

**Solo aplica si existe un permiso emitido antes del 2026-09-02 y todavía
vigente.** Si no existe ninguno, se anota "no aplica" — no se inventa uno.

**A. Abrir un permiso emitido antes del 2026-09-02.**

- **Pasa:** dice **"Entradas libres hasta que venza"**.
- **Falla:** dice "Una sola entrada". Se le cambió la regla a un permiso que
  alguien ya entregó.

**B. Dictarlo en portería dos veces.**

- **Pasa:** las dos veces sirve.
- **Falla:** la segunda lo rechaza por usado. Eso es quitarle un acceso a alguien
  que nunca aceptó perderlo — lo que la Decisión 014 dice explícitamente que no
  debe pasar.

---

# TC-015-01 — Un permiso quemado por error se devuelve

**Qué decisión prueba:** la 015. El portero toca una razón, nunca escribe; y
"el visitante no entró" hace que el permiso vuelva a servir.

**Por qué importa que sea a mano:** la Decisión 014 dejó este hueco a propósito.
Desde que se publicó, un permiso de una sola entrada verificado por equivocación
queda quemado y la persona no puede entrar. Esto es lo único que lo cierra, y
solo se ve haciéndolo.

## Antes de empezar

- Estar dentro como administrador, con una sede y un interior.
- La revisión publicada es posterior al 2026-09-03.

## Los pasos

**A. Emitir un permiso de "Una sola entrada" y verificarlo en portería.**

- **Pasa:** "Puede entrar".

**B. Mirar la misma pantalla, debajo del resultado.**

- **Pasa:** aparece **"¿Pasó algo distinto?"** con **cuatro** opciones:
  *El visitante no entró*, *Lo envié a otra entrada*, *Dijo que vuelve más
  tarde*, *Pedí confirmación al residente*. **No hay ninguna casilla para
  escribir texto.**
- **Falla A:** hay un campo de texto libre. Eso es lo que la decisión rechaza —
  ahí terminan cédulas y descripciones de personas.
- **Falla B:** faltan opciones, o alguna sale en inglés.

**C. Tocar "El visitante no entró".**

- **Pasa:** confirma con **"Listo. El permiso vuelve a servir."**
- **Falla:** un mensaje genérico, o un error.

**D. Verificar el mismo código otra vez, en la misma entrada.**

- **Pasa:** **"Puede entrar"**. Este es el paso que justifica toda la unidad.
- **Falla:** dice "ya se usó". Entonces no se devolvió nada y el hueco sigue
  abierto.

**E. Abrir el detalle del permiso.**

- **Pasa:** después del paso C y antes del D, el detalle dice **"El visitante no
  llegó a entrar"** — no "Todavía no se ha usado". Son dos hechos distintos y la
  pantalla los distingue.
- **Falla:** dice "Todavía no se ha usado". Se perdió lo que pasó.

**F. Tocar una razón, y mirar qué queda en la pantalla.**

- **Pasa:** las opciones **desaparecen** y solo queda "Verificar otro". Un
  portero no puede anotar dos veces sobre la misma revisión.
- **Falla:** los botones siguen ahí y se pueden tocar otra vez. El contador
  podría bajar por debajo de lo que de verdad pasó.

> El servidor también rechaza una segunda anotación, con "Ya se anotó algo
> sobre esta revisión." Ese camino **no se puede alcanzar desde una sola
> pantalla** — es para dos porteros en dos teléfonos sobre la misma revisión, y
> está cubierto por prueba automática. Se dice aquí para que nadie lo busque a
> mano y concluya que falta.

**G. Verificar un permiso en la entrada equivocada (si hay dos sedes).**

- **Pasa:** rechaza, y debajo aparecen **solo tres** opciones — *El visitante no
  entró* no está.
- **Falla:** aparece. Le estaría pidiendo al portero que anote lo que la
  pantalla acaba de decir.
- **No aplica** si la organización tiene una sola sede. Se anota así, no se
  inventa una.

## Qué anotar

Fecha, revisión publicada, y el resultado de cada paso. La foto más útil es la
del paso D: un permiso que decía "ya se usó" diciendo otra vez "puede entrar".

## Lo que no cubre

**La ventana de diez minutos no se prueba aquí.** Exigiría esperar diez minutos
frente a la pantalla. Está cubierta por prueba automática en los dos sentidos —
a los nueve minutos acepta, a los once rechaza con "Pasaron más de 10 minutos
desde la revisión". Se anota como no probado a mano, no como probado.

## Lo que esta prueba no puede probar, y hay que decirlo

No prueba que el portero diga la verdad. Un portero deshonesto puede dejar
entrar a alguien y después tocar "no entró". Nada en esta capa lo impide — el
Fundador lo aceptó con esas palabras. Lo que sí hace el producto es dejarlo
escrito: quién, cuándo y contra cuál permiso.

---

# TC-HIST-01 — El historial, y sobre todo quién NO lo ve

**Qué prueba:** la historia US-007. Qué pasó en las puertas, y el límite que la
hace aceptable: **un responsable no puede ver las entradas de otro apartamento,
y un portero no puede verlo en absoluto.**

**Por qué importa que sea a mano:** esta pantalla depende de índices en la base
de datos. En este proyecto ya pasó tres veces que un índice quedó declarado y
sin publicar, siempre con las pruebas en verde (R-16). **Una prueba automática
no puede ver esa falla: usa una base de datos falsa que contesta lo que
Firestore rechazaría.** Solo se ve pidiéndole la pantalla a la base real.

## Antes de empezar

- La revisión publicada es posterior al 2026-09-03.
- Existen entradas registradas — si no, verifique un permiso en portería
  primero, para que haya algo que mirar.
- **Para el paso C hace falta un segundo interior con otro responsable.** Si la
  organización no lo tiene, se anota "no aplica" y **se dice en el resultado**;
  no se marca como aprobado.

## Los pasos

**A. Como administrador, abrir la pestaña "Entradas".**

- **Pasa:** carga una lista, lo más reciente arriba. Cada línea dice quién, qué
  interior, cuándo, por qué entrada, y si entró o no.
- **Falla A:** un error, o queda cargando. Casi siempre significa **un índice
  declarado y no publicado** — es exactamente el síntoma de R-16.
- **Falla B:** carga vacía habiendo entradas registradas.

**B. Un rechazo dice cuál rechazo fue.**

- **Pasa:** una línea rechazada dice el motivo con palabras — por ejemplo *"Este
  permiso era para una sola entrada y ya se usó"*.
- **Falla:** dice solo "No entró", o un texto genérico. Quien lee esto una
  semana después está haciendo la misma pregunta que hizo el portero en la
  puerta; "no" no responde nada.

**C. El límite. Entrar como un responsable y mirar la misma pestaña.**

- **Pasa:** ve **solo** las entradas de sus propios interiores. Las del otro
  apartamento **no aparecen por ninguna parte**: ni el número, ni el nombre del
  visitante.
- **Falla:** aparece aunque sea una línea de otro apartamento. **Esto es una
  falla grave, no un detalle** — es el vecino leyendo quién visita al vecino.
- **No aplica** si no hay un segundo interior con otro responsable. Se anota
  así.

**D. Entrar como portero y buscar la pestaña.**

- **Pasa:** **la pestaña "Entradas" no existe** para él. Y si escribe la
  dirección a mano, la pantalla no le muestra el historial.
- **Falla:** la ve. Un portero que puede leer quién entró a qué apartamento y a
  qué hora, durante noventa días, tiene lo que la Decisión 007 le quitó a
  propósito.

**E. Filtrar por fecha.**

- **Pasa:** elegir un rango deja solo lo de esas fechas. Elegir el mismo día en
  las dos casillas muestra ese día entero, no vacío.
- **Falla:** el mismo día dos veces devuelve nada.

**F. "Solo los rechazados".**

- **Pasa:** quedan únicamente las líneas rechazadas.
- **Falla:** siguen apareciendo las que sí entraron.

**G. La anotación del portero.**

- **Pasa:** si un portero anotó algo (Decisión 015), aparece **debajo** de la
  revisión que corrige, no como una línea suelta sin contexto.
- **No aplica** si no hay anotaciones todavía.

## Qué anotar

Fecha, revisión publicada, y el resultado de cada paso. **El paso C es el que
hay que fotografiar**: la pantalla de un responsable sin rastro del otro
apartamento.

## Lo que hay que volver a correr

Este caso se repite **cada vez que se agregue un filtro nuevo al historial**.
Cada filtro es un índice más, y un índice de más es otra oportunidad de que
quede declarado y sin publicar.

---

# TC-016-01 — Un permiso con días y horas sirve solo dentro de ellos

**Qué decisión prueba:** la 016. Un permiso puede llevar días de la semana y una
franja de horas; la portería lo niega afuera de eso y dice cuándo sí sirve.

**Por qué importa que sea a mano:** hay una prueba automática para cada regla, y
todas pasan. Lo que ninguna puede ver es si el residente entiende la pregunta, si
los botones de los días se pueden tocar con un pulgar, y si el vigilante alcanza a
leer la frase que dice cuándo volver mientras alguien lo espera en la puerta.

**Lo que esta prueba mide con reloj:** hay que correrla en un momento que caiga
dentro del horario y en otro que caiga afuera. Elija el horario alrededor de la
hora en que la está corriendo — no al revés.

## Antes de empezar

- Estar dentro como administrador (el administrador también puede verificar en la
  portería, así que una sola cuenta alcanza).
- La organización tiene por lo menos una sede y un interior.
- **Anote la hora exacta a la que empieza.** Todo lo de abajo depende de ella.
- **Anote qué revisión está viva.** Si es anterior al 2026-09-04, la Decisión 016
  no está publicada y este caso no aplica todavía.

## Los pasos

**A. La pregunta aparece.** Permisos → crear uno nuevo.

- **Pasa:** la pantalla pregunta **"¿Sirve a cualquier hora?"**, y la respuesta
  que viene puesta es **"Sí, a cualquier hora"**. Debajo hay una frase corta que
  explica qué significa.
- **Falla:** la pregunta no aparece, o viene puesta en "solo ciertos días y
  horas". Lo segundo sería peor: le pone trabajo a todo el que solo quiere dejar
  entrar a una visita.

**B. Elegir días y horas.** Cambie la respuesta a *"No, solo ciertos días y
horas"*.

- **Pasa:** aparecen siete botones (lun, mar, mié, jue, vie, sáb, dom) con lunes
  primero y domingo último, y dos campos de hora. Vienen puestos de lunes a
  viernes, de 7:00 a 16:00.
- **Pasa:** al tocar un día, se ve encendido o apagado. No hay que adivinar
  cuáles están elegidos.
- **Falla:** el domingo aparece de primero. Eso sería el orden que usa el
  servidor, no el que busca una persona.

**C. Un horario imposible se rechaza antes de enviarlo.** Ponga *desde* 22:00 y
*hasta* 06:00.

- **Pasa:** al crear, la pantalla dice que un horario no puede pasar de la
  medianoche **y dice qué hacer**: hacer dos permisos. El mensaje aparece sin que
  la página recargue.
- **Falla:** el permiso se crea, o el mensaje solo dice "error".

**D. Crear el permiso dentro del horario.** Elija **el día de hoy** y una franja
que contenga la hora actual (por ejemplo, si son las 2:15 p. m., ponga 2:00 p. m.
a 5:00 p. m.). Fechas: desde hoy, hasta dentro de una semana. Cree el permiso.

- **Pasa:** el permiso se crea y la pantalla del permiso muestra una línea
  **"Días y horas"** con el horario escrito como se dice: por ejemplo *"martes, de
  2:00 p. m. a 5:00 p. m."*.
- **Falla:** la línea no aparece, o muestra números (`[2]`, `14:00`) en vez de
  palabras.

**E. La portería lo deja entrar.** Vaya a Portería, elija la entrada del interior
y escriba el código.

- **Pasa:** dice **"Puede entrar"**.
- **Falla:** dice que no. Entonces la hora se está leyendo mal — anote la hora
  exacta, el horario que puso, y pare aquí.

**F. Fuera del horario, no lo deja entrar.** Vuelva al permiso, o cree uno nuevo
igual pero con una franja que **no** contenga la hora actual (por ejemplo 6:00
a. m. a 7:00 a. m. si es de tarde). Verifíquelo en la portería.

- **Pasa:** dice **"No puede entrar"** y debajo **"Este permiso no sirve a esta
  hora"**.
- **Pasa:** debajo de eso aparece **"Sirve: …"** con el horario en palabras. Esta
  línea es la razón de ser del caso: sin ella el vigilante solo puede decir "no".
- **Falla:** dice "El permiso ya terminó" o "no es para esta entrada". Cualquiera
  de las dos manda al visitante a hacer algo que no lo va a ayudar.

**G. Un día que no está elegido.** Cree un permiso cuyo horario incluya la hora
actual pero **no** el día de hoy (elija solo el día de mañana). Verifíquelo.

- **Pasa:** *"Este permiso no sirve a esta hora"*, con la línea *"Sirve: …"*.
- **Falla:** lo deja entrar. Entonces se está mirando la hora y no el día.

**H. El rechazo queda en el historial.** Entre a Historial de entradas.

- **Pasa:** los intentos de F y G aparecen como rechazados, y el motivo dice *"Este
  permiso no sirve a esta hora"* — no un código en inglés.
- **Falla:** el motivo sale vacío, o sale en inglés.

## Qué anotar

La hora exacta de cada paso, el horario que puso en cada permiso, y **el texto
literal** que mostró la portería en E, F y G. Si algo falló, la hora es el primer
dato que hace falta para entenderlo.

## Lo que esta prueba no puede probar

- **Que la hora sea la del edificio y no la del teléfono.** Solo se ve con un
  teléfono puesto en otra zona horaria, o con un edificio que no esté en Colombia.
  Hoy no existe ninguno de los dos. Está cubierto por prueba automática, y eso es
  todo lo que hay.
- **El cambio de hora (horario de verano).** Colombia no lo tiene. Aparecerá el
  día que haya un cliente en Chile o en México.

---

# TC-016-02 — Los permisos de antes no cambiaron de regla

**Qué decisión prueba:** la 016, por el lado que más caro cuesta si falla. Un
permiso creado antes del 2026-09-04 no tiene horario, y **no tener horario tiene
que significar "a cualquier hora"**, nunca "a ninguna".

**Por qué importa que sea a mano:** si esto se rompió, se rompió en producción y
para permisos que ya están en manos de gente. La prueba automática cubre la regla;
esta cubre que lo publicado la tenga.

## Antes de empezar

- Un permiso creado **antes** del 2026-09-04 que todavía esté activo. Si no hay
  ninguno, este caso no se puede correr y hay que decirlo así, no inventarlo.

## Los pasos

**A. Abrir el permiso viejo.**

- **Pasa:** la pantalla **no** muestra la línea "Días y horas". Un permiso sin
  horario no dice nada sobre horarios.
- **Falla:** aparece la línea con un horario. Alguien le puso uno.

**B. Usarlo en la portería, a la hora que sea.**

- **Pasa:** dice "Puede entrar" (o "ya se usó", si era de una sola entrada y ya se
  usó — eso también cuenta como pasar: la regla vieja sigue mandando).
- **Falla:** dice *"Este permiso no sirve a esta hora"*. Eso sería una puerta
  cerrada que nadie decidió cerrar, y hay que revertir de inmediato.

## Qué anotar

La fecha de creación del permiso que usó, y qué contestó la portería.

---

# TC-018-01 — Un edificio nuevo espera aprobación

**Qué decisión prueba:** la 018, y con ella cierra R-01, el riesgo más viejo del
proyecto. Un edificio recién creado puede armarse solo, y **no puede meter datos
de terceros** hasta que una persona lo apruebe.

**Por qué importa que sea a mano:** hay pruebas automáticas para cada regla. Lo
que ninguna puede ver es si el administrador entiende **qué le está pasando** y
**qué puede hacer mientras tanto**. Una pantalla que solo dice "no" en el momento
en que alguien acaba de registrar su edificio es una persona que se va.

## Antes de empezar

- Estar dentro de la aplicación con su cuenta.
- **Anote qué revisión está viva.** Si es anterior a la del 2026-09-04 por la
  tarde, la Decisión 018 no está publicada y este caso no aplica.

## Los pasos

**A. Crear una organización nueva.** Inicio → Crear organización.

- **Pasa:** se crea sin fricción y sin preguntar nada raro. Crear el edificio
  nunca se bloquea — lo que espera es otra cosa.
- **Falla:** no deja crearla. Entonces el muro quedó en el sitio equivocado.

**B. Armar una sede y un interior en ese edificio nuevo.**

- **Pasa:** las dos cosas funcionan normalmente. Eso es lo que la persona puede
  hacer mientras espera, y si no funciona, la espera es una pared en blanco.
- **Falla:** alguna de las dos se bloquea.

**C. Intentar agregar una persona.** Pestaña Personas.

- **Pasa:** **no hay botón de agregar.** En su lugar hay un texto que dice
  *"Estamos revisando este edificio"* y explica que es por los datos de los
  residentes, y que mientras tanto puede armar sedes e interiores.
- **Pasa:** el texto **no promete un correo**. Zeker no envía correos propios; si
  la pantalla dice "le avisamos", está mintiendo.
- **Falla:** aparece el botón. Peor aún si deja llenar el formulario y falla al
  enviarlo — eso es hacerle escribir a alguien para nada.

**D. Intentar crear un permiso.** Pestaña Permisos.

- **Pasa:** tampoco hay botón, y el texto explica que un permiso guarda el nombre
  de quien entra.
- **Falla:** aparece el botón.

**E. Aprobarlo.** En una terminal:

    cd backend && npm run aprobar

- **Pasa:** el edificio nuevo aparece en la lista, con su nombre, su ciudad,
  quién lo creó y cuánto lleva armado.
- **Pasa:** **no aparece ningún nombre de residente ni de visitante.** Si
  apareciera, la herramienta de aprobar se volvió una lista de quién vive dónde.
- **Falla:** la lista sale vacía. Entonces el edificio se creó ya aprobado.

Después: `npm run aprobar -- <el id que salió>`.

**F. Volver al navegador y recargar Personas.**

- **Pasa:** el botón de agregar apareció, y agregar una persona funciona.
- **Falla:** sigue diciendo que está en revisión. Entonces la aprobación no
  llegó, o la pantalla la está leyendo mal.

## Qué anotar

El id del edificio, la hora, y **el texto literal** que mostraron las pantallas
en C y D. Si algo falló, ese texto es el primer dato.

## Lo que esta prueba no cubre, y hay que decirlo

**La persona que espera no tiene cómo escribirnos.** Zeker no manda correos, no
hay dirección de contacto y D-008 sigue sin respuesta. Esta prueba puede pasar
entera y aun así, un desconocido de verdad quedaría sentado frente a una pantalla
sin nadie a quien preguntarle. Está escrito en la Decisión 018 como un hueco
conocido, no como un descuido.

---

# TC-018-02 — Los edificios que ya existían no cambiaron

**Qué prueba:** que "sin campo de aprobación" se lea como **aprobado**. Si esto
falla, el Fundador queda encerrado fuera de su propio edificio por una regla que
no existía cuando lo creó.

## Los pasos

**A. Abrir la organización "compartir"** (creada antes del 2026-09-04) y entrar a
Personas.

- **Pasa:** el botón de agregar está ahí, como siempre.
- **Falla:** dice que está en revisión. Revertir de inmediato: eso es cerrarle la
  puerta a alguien sin que nadie lo haya decidido.

**B. Crear un permiso en ese edificio.**

- **Pasa:** funciona.
- **Falla:** lo niega.

---

# TC-NOMBRE-01 — Una persona corrige su propio nombre

**Qué prueba:** que un error de tipeo al registrarse deje de ser permanente. Hasta
hoy no había ningún sitio en todo el producto para cambiar un nombre, y un interior
cuyo responsable no tenía nombre se leía *"asignado, sin nombre registrado"* sin
salida.

**Por qué a mano:** el nombre no se guarda solo para quien lo escribe. Lo ve el
administrador del edificio en la lista de personas, y ahí es donde importa que el
cambio llegue de verdad.

## Antes de empezar

- Una sesión iniciada en el producto publicado.
- Saber cómo se llama usted hoy en la lista de Personas de un edificio suyo.

## Los pasos

**A. Abrir la pantalla de inicio.**

- **Pasa:** debajo del correo aparece el enlace **"Cambiar mi nombre"**.
- **Falla:** no está. Entonces la corrección no se publicó.

**B. Tocarlo.**

- **Pasa:** se abre un formulario con el nombre y el apellido **ya llenos** con lo
  que usted tiene hoy. Dice que así lo ven los administradores y que el correo no
  se cambia ahí.
- **Falla:** los campos salen vacíos. Eso convierte una corrección en volver a
  escribir todo, y quien solo quería arreglar una letra pierde el apellido.

**C. Borrar el nombre y guardar sin escribir nada.**

- **Pasa:** el formulario se queda y señala que el nombre es obligatorio.
- **Falla:** guarda un nombre vacío. Eso es exactamente el estado del que veníamos.

**D. Cambiar el nombre por otro reconocible y guardar.**

- **Pasa:** el saludo de arriba cambia **sin recargar la página**, y aparece
  "Listo, su nombre quedó cambiado".
- **Falla:** hay que recargar para verlo, o no cambia.

**E. Entrar a Personas en un edificio suyo.**

- **Pasa:** su fila muestra el nombre nuevo.
- **Falla:** muestra el viejo. El cambio se quedó en una sola pantalla.

**F. Dejarlo como estaba.** Volver a poner su nombre real, para no dejar datos de
prueba en producción.

## Qué anotar

Qué nombre puso, y si el paso E lo mostró.

---

# TC-TEXTO-01 — Cada estado de un permiso dice lo suyo

**Qué prueba:** el defecto que estaba escondido detrás de una queja de texto del
Fundador (2026-09-03). La pantalla decía *"Este permiso ya terminó"* para
**cualquier** estado que no fuera anulado — incluido uno que simplemente se usó y
uno que todavía no empieza. No era una frase mal escrita: era la frase equivocada.

**Por qué a mano:** la prueba automática comprueba la regla. Esta comprueba que lo
que está publicado la tenga, y que las cuatro frases se lean distintas para una
persona de afán.

## Antes de empezar

Cuatro permisos en el mismo edificio, uno por estado. Los tres primeros se arman en
minutos; si alguno no se puede armar, se dice, no se inventa:

- uno **anulado**,
- uno **de una sola entrada, ya usado** en la portería,
- uno **que empieza mañana**,
- uno **vencido** (fecha final ya pasada).

## Los pasos

**A. Abrir el anulado.**

- **Pasa:** "Este permiso está anulado. Su código ya no sirve."
- **Falla:** cualquier otra.

**B. Abrir el que ya se usó.**

- **Pasa:** dice que **era para una sola entrada y ya se usó**, y ofrece hacer uno
  nuevo si la persona tiene que volver.
- **Falla:** dice "ya se venció" o "ya terminó". Ese es el defecto que se arregló;
  si vuelve, no se publicó.

**C. Abrir el que empieza mañana.**

⚠️ **Corregido el 2026-09-04 después de correrlo.** Este paso estaba escrito
sobre una frase que la pantalla no muestra. Un permiso programado **sí es
utilizable** — se manda el QR antes de que empiece, a propósito — así que la
pantalla enseña el código, la etiqueta "Programado" y la fecha desde la que
sirve, y **nunca** el mensaje de "todavía no empieza". Esa frase existe en el
producto y no la alcanza nadie.

- **Pasa:** etiqueta "Programado", la fecha de inicio a la vista, y el código
  entregable.
- **Falla:** dice que se venció, o esconde el código. Cualquiera de las dos deja
  al residente sin poder mandar el QR por adelantado.

**D. Abrir el vencido.**

- **Pasa:** dice que **ya se venció** y nombra la fecha hasta la que servía.
- **Falla:** cualquiera de las otras tres.

**E. En la portería, con un permiso con horario, en un día que no le toca.**

- **Pasa:** *"Este permiso no sirve en este día ni a esta hora."* — nombra el día,
  no solo la hora.
- **Falla:** dice solo "a esta hora". Un vigilante de afán mira el reloj y no el
  calendario, y le dice al visitante que vuelva más tarde el mismo día.

## Qué anotar

Las cuatro frases, tal como salieron.

---

# TC-CUPO-01 — El tope de permisos del día

**Qué prueba:** la última de las tres condiciones que el Fundador puso para poder
cobrar. Nada limitaba cuántos permisos podía crear un cliente, y el permiso es el
registro que de verdad se acumula. Ahora son **50 por día** en el plan gratis.

**Lo que esta prueba NO puede hacer a mano, y hay que decirlo:** llegar a 50
permisos a mano no es razonable, y crear 50 permisos de prueba en producción deja
basura que después hay que borrar. **La negación en el permiso 51 la cubre la
prueba automática**, no esta. Lo que esta prueba cubre es lo que la automática no
puede ver: que la cuenta del día se mueva en la base de datos publicada, y que si
alguien llega al tope lea una frase que le sirva.

## Los pasos

**A. Crear un permiso cualquiera.**

- **Pasa:** se crea como siempre. El tope no estorba a nadie normal — ese es el
  requisito principal.
- **Falla:** lo niega. Revertir de inmediato.

**B. Leer la organización en la base de datos** (`organizations/{id}`).

- **Pasa:** tiene `permits_day` con la fecha de hoy en UTC y `permits_today` con un
  número que subió en uno.
- **Falla:** los campos no están, o `permits_today` no se movió. Entonces el tope
  no cuenta nada y no existe.

**C. La frase del tope, sin llegar a 50.** Se comprueba en el código, no en la
pantalla: el mensaje `permit_limit_reached` tiene su propia frase en español
("Ya creó todos los permisos que se pueden crear hoy... Puede seguir mañana").

- **Pasa:** la prueba automática de mensajes lo confirma.
- **Falla:** si cae en "algo salió mal, intente de nuevo", la persona reintenta
  contra un límite que solo se abre mañana. **Así estaba el 2026-09-04 por la
  mañana, y se arregló antes de publicar.**

## Qué anotar

El número que tenía `permits_today` antes y después.

---

# TC-019-01 — Un edificio nuevo pide el NIT

**Qué decisión prueba:** la 019. Hasta hoy la aprobación no pedía nada: quien
aprobaba miraba el nombre del edificio y levantaba la mano.

**Por qué a mano:** el costo de esta decisión no es técnico, es de mercado. Lo
que hay que ver con los ojos es **cuánto estorba**, porque si estorba demasiado
se devuelve.

## Los pasos

**A. Crear una organización sin tocar el campo del NIT.**

- **Pasa:** no deja, y dice que son entre 8 y 11 números. **No se creó nada** —
  compruébelo volviendo a la lista de organizaciones.
- **Falla:** la crea igual. Entonces el campo es decorativo.

**B. Escribir un NIT con puntos y guion: `901.234.567-8`.**

- **Pasa:** lo acepta.
- **Falla:** lo rechaza por los puntos. Nadie escribe un NIT sin puntos.

**C. Abrir la herramienta de aprobación** (`npm run aprobar`).

- **Pasa:** el edificio nuevo aparece con su NIT, en números, listo para
  comparar contra el edificio que la persona dice administrar.
- **Falla:** no lo muestra. Entonces se pidió un dato que el que aprueba no ve.

**D. Abrir un edificio creado antes de hoy** (`compartir`).

- **Pasa:** funciona igual que siempre. En la herramienta de aprobación su NIT
  se lee como "creada antes del 2026-09-05", no como un error.
- **Falla:** lo rompe, o lo marca como incompleto. Eso sería castigar a los
  edificios que existían por una regla que no existía cuando se crearon.

## Qué anotar

**Cuánto se demoró usted en el paso B**, y si tuvo que ir a buscar el número.
Ese dato vale más que el resto de la prueba: es el costo de mercado de la
decisión, medido en la única persona disponible.

---

# TC-020-01 — Una persona sin apellido

**Qué decisión prueba:** la 020. El apellido dejó de ser obligatorio.

## Los pasos

**A. Agregar una persona escribiendo solo el nombre.**

- **Pasa:** la crea. En la lista de Personas aparece con su nombre solo, sin un
  espacio raro ni una coma colgando.
- **Falla:** exige el apellido, o muestra "María " con basura al final.

**B. En su propia cuenta, borrar el apellido y guardar.**

- **Pasa:** guarda. El saludo queda con el nombre solo.
- **Falla:** no deja borrarlo. Entonces el producto solo sabe acumular datos.

**C. Mirar un interior cuyo responsable no tiene apellido.**

- **Pasa:** dice el nombre, y no "sin nombre registrado".
- **Falla:** lo trata como si no tuviera nombre.

## Qué anotar

Si algún sitio del producto muestra el nombre con un espacio de más.

---

# TC-AUTH-RESET-01 — Recuperar la contraseña, de punta a punta

✅ **Pasó el 2026-09-02**, a mano, por el Fundador, en un teléfono: llegó el
correo, puso la contraseña, entró y emitió un permiso.

**Qué hay que recordar de este caso, y por qué no se puede automatizar:** una
dirección de correo inventada **no prueba nada**. Firebase contesta "listo" para
una cuenta que no existe, sin revisar nada más, para no revelar quién tiene
cuenta. El 2026-09-02 a las 11:20 esa prueba dio verde contra un sistema
completamente roto (R-27). Se corre con una dirección real, que reciba el correo.

Se vuelve a correr cuando cambie cualquier permiso de acceso: la llave del
navegador, la lista de dominios autorizados, o la dirección donde vive la
aplicación.

---

# TC-PHONE-01 — El producto en un teléfono real

⬜ **Nunca corrido entero.** Las condiciones son fáciles de equivocar y sin ellas
la prueba no mide nada:

- Datos móviles encendidos y Wi-Fi apagado.
- Sin tráfico al sitio durante 20 minutos antes, o la medición de velocidad no
  mide nada: el servidor ya está caliente.
- Afuera, al sol, con el brillo al 50%. Si se lee al 100% pero no al 50%, eso se
  anota como falla, no como "casi".

Las cuatro preguntas y sus líneas de pasa/falla están pendientes de escribir aquí.


---

# Registro de corridas

## 2026-09-04 (noche) — TC-NOMBRE-01, TC-TEXTO-01 y TC-CUPO-01

Contra producción, revisiones `zeker-api-00012-m9b` y `zeker-web-00012-gpx`,
publicadas esta noche. El Fundador entró; los pasos los condujo la sesión en su
navegador. Organización `compartir`, hora local Colombia ~21:00.

### TC-NOMBRE-01 — pasa, cinco pasos de seis

| Paso | Resultado |
|---|---|
| A. El enlace existe | ✅ "Cambiar mi nombre", debajo del correo |
| B. Campos con lo de hoy | ✅ vacíos, **y eso era lo correcto**: esta cuenta no tenía nombre |
| C. Guardar en blanco | ✅ "Escriba su nombre." / "Escriba su apellido.", el formulario se queda |
| D. Guardar un nombre | ✅ el saludo pasó de "Hola" a "Hola, Prueba Nombre" **sin recargar** |
| E. Lo ve el administrador | ✅ en Personas la fila dice "Prueba Nombre Prueba Apellido" |
| F. Dejarlo como estaba | ⬜ **pendiente**: la cuenta no tenía nombre, así que "como estaba" es en blanco. Queda esperando el nombre real del Fundador |

**Lo que la prueba mostró y no era el objeto de la prueba:** la cuenta del
Fundador saludaba con un "Hola" pelado desde que existe. No había ningún sitio
donde arreglarlo, y por eso nadie lo arregló.

### TC-TEXTO-01 — pasa, con un paso corregido

| Paso | Resultado |
|---|---|
| A. Anulado | ✅ "Este permiso está anulado. Su código ya no sirve." |
| B. Usado | ✅ "era para una sola entrada y ya se usó. Haga uno nuevo si la persona tiene que volver." — **el defecto que decía "ya terminó" no volvió** |
| C. Programado | ⚠️ **el paso estaba mal escrito, no el producto.** Ver la corrección arriba |
| D. Vencido | ✅ "Este permiso ya se venció. Ya pasó la fecha hasta la que servía." |
| E. Portería, día equivocado | ✅ "Este permiso no sirve en este día ni a esta hora." y debajo "Sirve: sábado, de 12:00 p. m. a 3:00 p. m." |

**Hallazgo:** la frase `permits.scheduled` ("Este permiso todavía no empieza")
**sigue sin poder verse desde ninguna pantalla**, porque un permiso programado
cuenta como utilizable y por eso enseña el código. El mensaje del commit del
2026-09-04 dijo que esa frase "por fin se alcanza". **No es cierto.** En la
portería sí hay un rechazo propio para un permiso que no ha empezado, y ese sí
funciona.

### TC-CUPO-01 — pasa

| Paso | Resultado |
|---|---|
| A. Crear un permiso normal | ✅ se creó sin estorbo |
| B. La cuenta del día en la base | ✅ antes: los dos campos **no existían**. Después: `permits_day: "2026-09-05"`, `permits_today: 1` |
| C. La frase del tope | ✅ tiene la suya desde hoy — y no la tenía cuando se escribió este caso |

**Hallazgo, y hay que escribirlo antes de que alguien lo dé por hecho:** el día
del tope se cuenta en **UTC**. En Colombia eso significa que la cuenta se
reinicia a las **7:00 p. m. hora local**, no a medianoche. A 50 permisos por día
no le hace daño a nadie, pero desde la Decisión 016 el producto ya sabe en qué
reloj vive cada edificio, y este contador no lo usa.

### Datos de prueba que quedaron en producción

- El permiso **"Prueba Programado"** (anulado) en `compartir`.
- El nombre **"Prueba Nombre Prueba Apellido"** en la cuenta del Fundador,
  hasta que ponga el suyo.

---


## 2026-09-03 — TC-014-01, TC-014-02, TC-014-03

**Contra:** producción. Aplicación `zeker-web-00005-x8k`, API `zeker-api-00005-ml2`.
**Quién:** la sesión de IA, manejando el navegador; el Fundador puso la contraseña
y nada más. Navegador Edge en Windows, organización "compartir".

**Resultado: los tres pasan.** Ningún paso falló.

| Caso | Paso | Qué se vio |
|---|---|---|
| 014-01 | A | La pregunta "¿Cuántas veces sirve?" está en la pantalla de crear, con las dos opciones y su explicación |
| 014-01 | B | El detalle dice "Una sola entrada" y "Todavía no se ha usado" |
| 014-01 | C | Primera entrada: "Puede entrar", con nombre e interior |
| 014-01 | D | Segunda entrada: "No puede entrar — Este permiso era para una sola entrada y ya se usó. Pídale al residente que haga uno nuevo." Palabra por palabra lo escrito de antemano |
| 014-01 | E | Estado "Ya se usó", línea "Entró el 3 de sept de 2026, 8:58 a. m.", y el QR desapareció solo |
| 014-01 | F | En la lista aparece "Ya se usó", distinto de "Activo" y de "Vencido" |
| 014-02 | A–C | Dos entradas seguidas, las dos "Puede entrar". Detalle: "Entró el 3 de sept de 2026, 9:05 a. m. · Entradas registradas: 2", sigue Activo, el QR sigue ahí |
| 014-03 | A | Permiso emitido el 2 de septiembre, antes de la decisión: dice "Entradas libres hasta que venza". No se le cambió la regla |
| 014-03 | B | Sirvió dos veces. Detalle: "Entradas registradas: 2" |

**Lo que la publicación rompió, y no fue la Decisión 014.** El script de
publicación borró la lista de direcciones a las que la API le permite hablar
(`CORS_ORIGINS`), porque estaba puesta a mano en la consola y no en el
repositorio. La aplicación entera quedó caída durante unos minutos, diciendo
"revise su conexión a internet" — que manda a la persona a buscar el problema
donde no está. Arreglado en la raíz: el valor vive ahora en
`scripts/desplegar.sh`. Recordado como el mismo tipo de falla que R-25/R-26:
**una configuración que existe en un solo lugar que ninguna publicación
respeta.**

**Un detalle de redacción, no una falla.** Un permiso gastado muestra el aviso
"Este permiso ya terminó", que suena a vencido y no a usado. La etiqueta y la
línea de uso sí dicen la verdad. Queda para el dueño de los textos.

## 2026-09-03 — El icono de la contraseña (hallazgo del Fundador)

**Síntoma:** en la pantalla de entrar, un icono de ojo aparece encima del texto
"Mostrar la contraseña".

**Causa:** Edge dibuja su propio control para ver la contraseña dentro del campo,
en cuanto el campo tiene texto, y cae justo sobre nuestro botón. Dos controles
para lo mismo, uno tapando al otro.

**Probado, no supuesto.** Mismo navegador, mismo campo, texto escrito con
teclado de verdad:

| | Qué se vio |
|---|---|
| Sin el arreglo | El ojo de Edge encima de la palabra "Mostrar" |
| Con el arreglo | Ocho puntos y un solo control |

**Arreglo:** se oculta el control de Edge y se queda el nuestro, que tiene texto,
funciona con teclado y con lector de pantalla, y se ve igual en todos los
navegadores. En `frontend/app/globals.css`.

## 2026-09-03 — TC-015-01

**Contra:** producción. Aplicación `zeker-web-00006-chq`, API `zeker-api-00006-2xj`.
**Quién:** la sesión de IA, manejando el navegador con la sesión del Fundador.
Edge en Windows, organización "compartir", una sola sede.

**Resultado: pasa.** Ningún paso falló.

| Paso | Qué se vio |
|---|---|
| A | Permiso de una sola entrada verificado: "Puede entrar" |
| B | Aparece "¿Pasó algo distinto?" con las cuatro opciones. **Ninguna casilla de texto en la pantalla** |
| C | Al tocar "El visitante no entró": "Listo. El permiso vuelve a servir." |
| E | El detalle dice **"El visitante no llegó a entrar"**, no "Todavía no se ha usado". Estado Activo y el QR de vuelta |
| D | El mismo código, otra vez: **"Puede entrar"**. Este es el paso que justifica la unidad |
| F | Después de tocar una razón, **las tres opciones desaparecen** y solo queda "Verificar otro" |
| G | Con un código que no existe: "No puede entrar", y **solo tres opciones** — "El visitante no entró" no aparece |

**El paso F resultó mejor de lo que estaba escrito, y el caso quedó corregido.**
La versión original decía "tocar dos veces y esperar el rechazo *Ya se anotó
algo sobre esta revisión*". Por la pantalla eso **no se puede hacer**: al tocar
una vez, las opciones se reemplazan por la confirmación. El rechazo del
servidor existe y está cubierto por prueba automática — es para el caso de dos
porteros en dos teléfonos sobre la misma revisión. Lo que sí se puede verificar
a mano, y es lo que ahora dice el paso, es que la pantalla no deja llegar ahí.

**No se probó a mano:** la ventana de diez minutos. Exigiría esperar diez
minutos frente a la pantalla; está cubierta por prueba automática, en los dos
sentidos (a los 9 minutos acepta, a los 11 rechaza). Se anota como no probado a
mano, no como probado.

**Una comprobación aparte, que ayer habría ahorrado una caída:** esta
publicación **conservó la lista de direcciones de la API**, porque desde hoy
vive en el script. Es la primera prueba real de la corrección de R-28, con un
despliegue de verdad y no razonada.

**Datos de prueba que quedaron en producción**, en la organización del
Fundador, con nombres obviamente falsos: `Prueba 014 Una Entrada` (gastado),
`Prueba 014 Libres` y `Prueba 015 Devolucion` (activos hasta el 4 de
septiembre). Ninguno guarda nada de una persona real.

## 2026-09-03 — TC-HIST-01, parcial

**Contra:** producción. Aplicación `zeker-web-00007-sxd`, API `zeker-api-00007-mdz`.
**Quién:** la sesión de IA, con la sesión del Fundador. Edge en Windows.

**Resultado: seis pasan. El séptimo queda cubierto por prueba y no a mano, y se
anota así.**

| Paso | Resultado |
|---|---|
| A | ✅ La lista carga con lo más reciente arriba: quién, qué interior, cuándo, por qué entrada y si entró |
| B | ✅ Un rechazo dice cuál fue: *"Ese código no existe. Revise que esté bien escrito."* y *"Este permiso era para una sola entrada y ya se usó."* |
| C | ✅ **Pasa, y lo corrió el Fundador con sus propias manos.** Entró como `Vecina Prueba`, responsable del 202. La pantalla de Entradas dice **"Todavía no ha entrado nadie."** mientras **once entradas existen en el apartamento 101**. No una lista filtrada: nada. Tampoco aparecen las pestañas *Personas* ni *Portería* |
| D | ⚠️ **Cubierto por prueba, no a mano.** No existe una cuenta de portero en esta organización. Cuatro pruebas de frontend comprueban que la lista de pestañas de un portero es exactamente `["gate"]`, y una de backend que la API responde 403 |
| E | ✅ 11 filas sin filtro → 1 poniendo el mismo día en las dos casillas, y es la entrada de ese día. El caso que rompe este tipo de filtro no ocurre |
| F | ✅ "Solo los rechazados" deja exactamente los dos rechazos, cada uno con su motivo |
| G | ✅ La anotación del portero aparece debajo de la revisión que corrige: *"El portero anotó: El visitante no entró · Se le devolvió la entrada."* |

**Lo que el paso F probó de paso, y vale más que el filtro:** el índice de
`result` funcionando contra la base de datos real. Usado, no razonado.

**El dato detrás del paso C, leído en producción antes de correrlo**, para que
el resultado no dependa de lo que una pantalla diga:

```
Vecina Prueba        -> rol = responsable   (no administrador)
Apartamento 101      -> responsable: el Fundador
Apartamento 202      -> responsable: Vecina Prueba
Eventos registrados  -> 11 en el 101, 0 en el 202
```

Con eso, la única respuesta correcta era **cero**, y cero fue lo que se vio.

**Un momento de alarma que resultó infundado, y vale registrarlo.** El Fundador
reportó primero que la cuenta de prueba "tiene los mismos perfiles y permisos
que la normal". Se paró todo y se leyó el rol directamente en la base de datos
antes de tocar nada. Estaba bien. Lo que había visto era una cuenta que entra a
la misma organización y ve pantallas parecidas — cuatro pestañas de seis. La
diferencia que importa (*Personas* y *Portería* ausentes, y ninguna entrada
ajena) no se nota a simple vista, y **eso es una observación de producto, no un
error del Fundador**: si el dueño del producto no distingue de un vistazo una
cuenta de residente de una de administrador, un cliente tampoco lo hará.

**Una función vieja verificada de rebote:** al crear a Vecina Prueba, la
pantalla de personas mostró *"Aún no ha entrado"* — el estado construido el
2026-09-02 y nunca visto funcionando hasta hoy.


## 2026-09-04 — TC-016-01 y TC-016-02

**Contra lo publicado:** `zeker-web-00009-z7b` y `zeker-api-00009-gpb`, publicadas
ese mismo día. Antes de empezar se leyó en vivo que `CORS_ORIGINS` sobrevivió a la
publicación (R-28).

**Hora de la corrida:** viernes 4 de septiembre, entre las **12:55 y la 1:05 p. m.**,
hora de Bogotá. Toda la prueba depende de esa hora, así que queda escrita.

**Quién:** el Fundador entró con su cuenta; el resto lo condujo la sesión en el
navegador del Fundador, contra producción.

### TC-016-01 — los ocho pasos, todos pasan

| Paso | Qué se hizo | Qué contestó | |
|---|---|---|---|
| A | Abrir el formulario | *"¿Sirve a cualquier hora?"*, puesta en **"Sí, a cualquier hora"**, con su explicación debajo | ✅ |
| B | Cambiar a "solo ciertos días y horas" | Siete botones, **lunes primero y domingo último**, puestos de lunes a viernes 7:00–16:00, y la línea *"Las horas son las del edificio"* | ✅ |
| C | Poner 10:00 p. m. → 6:00 a. m. | *"Un horario no puede pasar de la medianoche. Si necesita la noche, haga dos permisos."* En rojo, sin recargar, y **el permiso no se creó** | ✅ |
| D | Crear "Prueba 016 Dentro": **viernes, 12:00 p. m. a 3:00 p. m.** | La pantalla del permiso muestra *"Días y horas: viernes, de 12:00 p. m. a 3:00 p. m."* — en palabras | ✅ |
| E | Verificarlo en la portería, **1:00 p. m.** | **"Puede entrar"** | ✅ |
| F | "Prueba 016 Hora Fuera": **viernes, 6:00 a 7:00 a. m.**, verificado a la 1:01 p. m. | **"No puede entrar"** · *"Este permiso no sirve a esta hora."* · **"Sirve: viernes, de 6:00 a. m. a 7:00 a. m."** | ✅ |
| G | "Prueba 016 Dia Fuera": **sábado, 12:00 p. m. a 3:00 p. m.**, verificado a la 1:03 p. m. | Lo niega igual, con *"Sirve: sábado, de 12:00 p. m. a 3:00 p. m."* | ✅ |
| H | Abrir el historial | Los dos rechazos aparecen con el motivo **en español**, no un código | ✅ |

**Un dato que salió de regalo en el paso H:** "Prueba 016 Dentro" registró **una
sola entrada**, a la 1:00 p. m. Durante la corrida se había pulsado "Verificar"
dos veces por dudas de la automatización, y el historial prueba que solo se
registró una. La transacción de la Decisión 014 hace lo que dice.

### TC-016-02 — los permisos viejos no cambiaron de regla

Se usó **"Prueba 015 Devolucion"**, creado el 3 de septiembre, todavía dentro de
sus fechas al momento de la prueba.

| Paso | Qué contestó | |
|---|---|---|
| A | La pantalla del permiso **no muestra** la línea "Días y horas" | ✅ |
| B | La portería contesta *"Este permiso era para una sola entrada y ya se usó. Pídale al residente que haga uno nuevo."* — la regla vieja, **no** el horario | ✅ |

**Evidencia que la pantalla no podía dar, leída directo de la base de datos:** ese
permiso **no tiene el campo `schedule` en absoluto** — no lo tiene en `null`, no lo
tiene. Ese es exactamente el caso que este caso de prueba existe para cubrir, y la
lectura lo confirma en vez de suponerlo.

### Dos observaciones, ninguna es una falla

1. **Cuando el día es el equivocado, el mensaje dice "no sirve a esta hora".** Es
   cierto en el sentido de "en este momento", y la línea de abajo aclara cuándo sí
   sirve. Pero un vigilante apurado puede mirar el reloj en vez del calendario.
   Vale la pena que Contenido decida si el mensaje debería distinguir el día de la
   hora. **No cambia lo que hace el producto.**
2. **Dos de las tres verificaciones necesitaron un segundo toque en "Verificar".**
   Puede ser la automatización (los clics sintéticos llegan antes de que la
   pantalla termine de actualizarse) y no el producto. **No se puede distinguir
   desde aquí**, y por eso queda anotado en vez de convertido en defecto: se
   confirma con un dedo de verdad en TC-PHONE-01.

### Lo que sigue sin probarse

- **Que la hora sea la del edificio y no la del teléfono.** Necesita un teléfono en
  otra zona horaria o un edificio fuera de Colombia; hoy no existe ninguno de los
  dos. Cubierto por prueba automática y por nada más.
- **El cambio de hora (horario de verano).** Colombia no lo tiene.


## 2026-09-04 (tarde) — TC-018-01 y TC-018-02

**Contra lo publicado:** `zeker-web-00011-zpj` y `zeker-api-00011-5rc`. Leído en
vivo antes de empezar: `CORS_ORIGINS` sobrevivió a la publicación (R-28).

**TC-018-02 se corrió primero**, a propósito: es la que más caro cuesta si falla.

| Caso | Paso | Qué contestó | |
|---|---|---|---|
| 018-02 | A | "compartir" (creada antes de hoy) sigue mostrando **"Agregar persona"** | ✅ |
| 018-02 | B | y sigue mostrando **"Crear permiso"** | ✅ |
| 018-01 | A | El edificio nuevo se creó sin fricción | ✅ |
| 018-01 | B | Sede e interior se crearon **sin aprobación**, que es lo que la persona puede hacer mientras espera | ✅ |
| 018-01 | C | Personas: **no hay botón**. Dice *"Estamos revisando este edificio"* y explica que es por los datos de los residentes. **No promete ningún correo** | ✅ |
| 018-01 | D | Permisos: tampoco hay botón, y dice que un permiso guarda el nombre de quien entra | ✅ |
| 018-01 | E | `npm run aprobar` lo lista con nombre, ciudad, quién lo creó y cuánto lleva armado — **y ningún nombre de residente ni de visitante** | ✅ |
| 018-01 | F | Después de aprobar, el botón de agregar apareció | ✅ |

### Tres cosas que salieron de conducirlo a mano, y ninguna prueba automática vería

1. **En Personas quedó una frase de más.** Encima del aviso sigue el texto sobre
   el correo de contraseña — que habla de invitar gente, que es justo lo que ahí
   no se puede hacer. No es falso, es ruido en el peor momento. → Contenido.
2. **En Permisos, "primero agregue un interior" gana sobre el aviso de revisión.**
   Es correcto y accionable, pero significa que la persona choca con dos muros
   seguidos en vez de uno. Observación, no falla.
3. **Se vio por fin en un navegador el arreglo del 2026-09-03** — el que estaba
   pendiente en la lista del Fundador. **Funciona:** un apartamento con
   responsable ya no se lee como "sin asignar", que era lo peligroso (un
   administrador podía entregárselo a otra persona). Lo que queda es que dice
   *"asignado, sin nombre registrado"*, y la causa quedó medida en vez de
   supuesta: **de las cuatro cuentas que existen, solo una no tiene nombre — la
   del Fundador**, creada antes de que el registro lo pidiera. El formulario de
   registro sí lo pide hoy. **El hueco real es otro: no existe ninguna pantalla
   donde una persona corrija su propio nombre.**

### Lo que estos casos no cubren

**La persona que espera aprobación no tiene cómo escribirnos.** Zeker no manda
correos, no hay dirección de contacto y D-008 sigue sin respuesta. Los dos casos
pueden pasar enteros y un desconocido real quedaría sentado frente a una pantalla
sin nadie a quien preguntarle.
