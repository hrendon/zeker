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
| TC-015-01 | Un permiso quemado por error se devuelve | ⬜ nunca corrido |
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

**F. Volver a portería, verificar de nuevo, y tocar dos veces una razón.**

- **Pasa:** la segunda vez rechaza con **"Ya se anotó algo sobre esta
  revisión."**
- **Falla:** acepta las dos. El contador podría bajar de la verdad.

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

## Lo que esta prueba no puede probar, y hay que decirlo

No prueba que el portero diga la verdad. Un portero deshonesto puede dejar
entrar a alguien y después tocar "no entró". Nada en esta capa lo impide — el
Fundador lo aceptó con esas palabras. Lo que sí hace el producto es dejarlo
escrito: quién, cuándo y contra cuál permiso.

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
