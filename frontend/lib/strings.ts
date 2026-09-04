/**
 * Every word the user reads lives here.
 *
 * The product is in Spanish (Colombia). Keeping the text in one file means
 * adding a second language later is a matter of adding a second object and a
 * switch, not of hunting through components. Nothing else in the app contains
 * user-facing text.
 */
export const es = {
  brand: {
    name: 'Zeker',
    tagline: 'Control de acceso para sus espacios',
  },

  common: {
    loading: 'Cargando…',
    email: 'Correo electrónico',
    password: 'Contraseña',
    firstName: 'Nombre',
    lastName: 'Apellido',
    back: 'Volver',
    signOut: 'Cerrar sesión',
    signingOut: 'Cerrando sesión…',
    showPassword: 'Mostrar la contraseña',
    hidePassword: 'Ocultar la contraseña',
    unnamedPerson: 'Persona sin nombre',
  },

  signIn: {
    title: 'Entrar',
    subtitle: 'Ingrese a su cuenta de Zeker.',
    submit: 'Entrar',
    submitting: 'Entrando…',
    forgot: '¿Olvidó su contraseña?',
    noAccount: '¿No tiene cuenta?',
    createAccount: 'Cree una',
  },

  signUp: {
    title: 'Crear cuenta',
    subtitle: 'Cree su cuenta para empezar a administrar accesos.',
    submit: 'Crear cuenta',
    submitting: 'Creando cuenta…',
    passwordHint: 'Mínimo 8 caracteres.',
    haveAccount: '¿Ya tiene cuenta?',
    signIn: 'Entre aquí',
  },

  reset: {
    title: 'Recuperar contraseña',
    subtitle:
      'Escriba su correo y le enviaremos un enlace para crear una contraseña nueva.',
    submit: 'Enviar enlace',
    submitting: 'Enviando…',
    // Deliberately the same message whether or not the account exists, so that
    // this page cannot be used to find out who has an account with us.
    sent:
      'Si existe una cuenta con ese correo, le enviamos un enlace para crear una contraseña nueva. Revise su bandeja de entrada y la carpeta de correo no deseado.',
    backToSignIn: 'Volver a entrar',
  },

  home: {
    // Existe porque un error de tipeo al registrarse era permanente, y un
    // interior cuyo responsable no tenía nombre se leía "asignado, sin nombre
    // registrado" sin ningún sitio a donde ir a corregirlo.
    editName: 'Cambiar mi nombre',
    editNameTitle: 'Su nombre',
    editNameHint:
      'Así lo ven los administradores de los edificios donde usted está. No es su correo: el correo no se cambia aquí.',
    editNameSaved: 'Listo, su nombre quedó cambiado.',
    greeting: 'Hola',
    roleLabel: 'Rol',
  },

  roles: {
    admin: 'Administrador',
    responsable: 'Responsable',
    security: 'Seguridad',
  },

  validation: {
    // Decision 016
    scheduleNeedsDay: 'Elija por lo menos un día.',
    scheduleOutOfOrder: 'La hora de "hasta" tiene que ser más tarde que la de "desde".',
    scheduleNoMidnight:
      'Un horario no puede pasar de la medianoche. Si necesita la noche, haga dos permisos.',
    emailRequired: 'Escriba su correo electrónico.',
    emailInvalid: 'Ese correo no parece válido.',
    passwordRequired: 'Escriba su contraseña.',
    passwordTooShort: 'La contraseña debe tener al menos 8 caracteres.',
    firstNameRequired: 'Escriba su nombre.',
    lastNameRequired: 'Escriba su apellido.',
    nameTooLong: 'Ese nombre es demasiado largo.',
    orgNameRequired: 'Escriba un nombre para la organización.',
    locationNameRequired: 'Escriba un nombre para la sede.',
    numberRequired: 'Escriba el número del interior.',
    responsableRequired: 'Elija quién es el responsable.',
    locationRequired: 'Elija una sede.',
    textTooLong: 'Ese texto es demasiado largo.',
    visitorNameRequired: 'Escriba el nombre de la persona que va a entrar.',
    interiorRequired: 'Elija a dónde va a entrar.',
    datesRequired: 'Escriba desde cuándo y hasta cuándo vale el permiso.',
    datesOutOfOrder: 'El permiso debe terminar después de empezar.',
    datesInThePast: 'El permiso ya habría terminado. Elija una fecha futura.',
    datesTooLong: 'Un permiso no puede durar más de un año.',
  },

  nav: {
    myOrgs: 'Mis organizaciones',
    backToOrgs: 'Volver a mis organizaciones',
    locations: 'Sedes',
    interiors: 'Interiores',
    members: 'Personas',
    permits: 'Permisos',
    history: 'Entradas',
    gate: 'Portería',
    changeOrg: 'Cambiar organización',
  },

  orgs: {
    listTitle: 'Sus organizaciones',
    empty: 'Todavía no tiene ninguna organización.',
    emptyHint: 'Cree una para empezar a registrar sus sedes y sus interiores.',
    createTitle: 'Crear organización',
    createSubtitle: 'Una organización es el cliente: un colegio, un edificio, una oficina.',
    create: 'Crear organización',
    creating: 'Creando…',
    name: 'Nombre',
    namePlaceholder: 'Conjunto Residencial Los Cedros',
    type: 'Tipo',
    description: 'Descripción (opcional)',
    city: 'Ciudad (opcional)',
    country: 'País (opcional)',
    countryHint: 'Dos letras. Por ejemplo: CO',
    noAddressNote:
      'No pedimos la dirección. La ciudad y el país son suficientes, y guardar menos datos protege a los residentes.',
    typeSchool: 'Colegio',
    typeResidence: 'Conjunto o edificio',
    typeOffice: 'Oficina',
    typeOther: 'Otro',
    open: 'Abrir',
  },

  org: {
    adminOnlyNote:
      'Solo un administrador puede crear, cambiar o eliminar. Usted puede consultar.',
    noAccessTitle: 'No encontramos esa organización',
    noAccessBody:
      'O no existe, o usted ya no pertenece a ella. Vuelva a su lista de organizaciones.',
  },

  locations: {
    title: 'Sedes',
    subtitle: 'Los sitios físicos que controla: un edificio, una sede, una portería.',
    empty: 'Todavía no hay sedes.',
    emptyHint: 'Necesita al menos una sede antes de poder agregar interiores.',
    add: 'Agregar sede',
    adding: 'Agregando…',
    addFirst: 'Agregar la primera sede',
    name: 'Nombre de la sede',
    namePlaceholder: 'Torre 1',
    description: 'Descripción (opcional)',
    retired: 'Sin usar',
    retire: 'Dejar de usar',
    reactivate: 'Volver a usar',
    retireConfirmTitle: '¿Dejar de usar esta sede?',
    retireConfirmBody:
      'Se conserva con toda su historia y sigue ocupando un lugar de su plan. Puede volver a usarla cuando quiera.',
    reactivateConfirmTitle: '¿Volver a usar esta sede?',
    reactivateConfirmBody: 'Volverá a estar disponible para registrar interiores y permisos.',
    deleteConfirmTitle: '¿Eliminar esta sede?',
    deleteConfirmBody:
      'Se borra para siempre y libera un lugar de su plan. Esta acción no se puede deshacer.',
    // The API refuses for either reason and does not say which, so the message
    // names both. A vague "that conflicts with something" leaves the
    // administrator with nothing to do about it.
    deleteConflict:
      'No se puede eliminar. La sede todavía tiene interiores, o hay permisos de entrada activos. Quite los interiores o anule los permisos, y vuelva a intentar.',
  },

  interiors: {
    title: 'Interiores',
    subtitle: 'Cada apartamento, bodega o zona dentro de una sede, con su responsable.',
    empty: 'Todavía no hay interiores.',
    emptyHint: 'Agregue el primero para empezar.',
    needsLocation: 'Primero cree una sede. Un interior siempre vive dentro de una sede.',
    goToLocations: 'Ir a sedes',
    add: 'Agregar interior',
    adding: 'Agregando…',
    addFirst: 'Agregar el primer interior',
    location: 'Sede',
    number: 'Número',
    numberPlaceholder: '302',
    name: 'Nombre (opcional)',
    namePlaceholder: 'Bodega esquinera',
    responsable: 'Responsable',
    responsableHint:
      'La persona que podrá crear permisos de entrada para este interior. Si todavía no tiene su correo, póngase usted y cámbielo después.',
    responsableNobody: 'Elija una persona',
    noResponsable: 'sin asignar',
    // Somebody IS in charge, but their account has no name recorded. Saying
    // "sin asignar" here is a lie that invites an administrator to hand the
    // apartment to somebody else. Found 2026-09-03.
    responsableWithoutName: 'asignado, sin nombre registrado',
    needsMember: 'Primero agregue a la persona que estará a cargo.',
    goToMembers: 'Ir a personas',
    handOver: 'Cambiar responsable',
    handOverTitle: '¿Cambiar el responsable?',
    handOverBody:
      'La persona que elija podrá crear permisos de entrada para este interior. La anterior dejará de poder hacerlo. Los permisos que ya existen no cambian.',
    filterAll: 'Todas las sedes',
    retired: 'Sin usar',
    retire: 'Dejar de usar',
    reactivate: 'Volver a usar',
    retireConfirmTitle: '¿Dejar de usar este interior?',
    retireConfirmBody:
      'Se conserva y sigue ocupando un lugar de su plan. Puede volver a usarlo cuando quiera.',
    reactivateConfirmTitle: '¿Volver a usar este interior?',
    reactivateConfirmBody: 'Volverá a estar disponible para registrar permisos de entrada.',
    deleteConfirmTitle: '¿Eliminar este interior?',
    deleteConfirmBody:
      'Se borra para siempre y libera un lugar de su plan. Esta acción no se puede deshacer.',
    deleteConflict:
      'No se puede eliminar. Todavía hay permisos de entrada activos para este interior. Anule los permisos y vuelva a intentar.',
    numberTaken:
      'Ya existe un interior con ese número en esa sede. Use otro número.',
  },

  members: {
    // Decisión 018. Dice qué pasa y qué SÍ se puede hacer mientras tanto.
    // Deliberadamente NO promete un correo: Zeker no envía correos propios, y
    // una pantalla que diga "le avisamos" está mintiendo.
    waitingApprovalTitle: 'Estamos revisando este edificio',
    waitingApprovalBody:
      'Antes de que un edificio pueda agregar personas, revisamos que quien lo registró de verdad lo administre. Es por los datos de sus residentes. Mientras tanto puede armar sus sedes y sus interiores: nada de eso se pierde.',
    title: 'Personas',
    subtitle:
      'Quién puede entrar a esta organización: los responsables de cada interior y el personal de seguridad.',
    empty: 'Todavía no ha agregado a nadie.',
    emptyHint:
      'Agregue al responsable de un interior o a alguien de seguridad. Recibirá un correo para crear su contraseña.',
    add: 'Agregar persona',
    addFirst: 'Agregar la primera persona',
    adding: 'Agregando…',
    firstName: 'Nombre',
    lastName: 'Apellido',
    email: 'Correo electrónico',
    emailHint:
      'Le enviamos un correo para que cree su propia contraseña. Nosotros nunca vemos ni guardamos esa contraseña.',
    role: 'Qué hace en la organización',
    roleResponsable: 'Responsable de un interior',
    roleSecurity: 'Personal de seguridad',
    roleResponsableHint: 'Puede crear permisos de entrada para su propio interior.',
    roleSecurityHint: 'Revisa los permisos en la portería. No puede crear permisos.',
    added: 'Listo. Le enviamos un correo para que cree su contraseña.',
    addedNoEmail:
      'La persona quedó agregada, pero no pudimos enviarle el correo. Pídale que use “Olvidé mi contraseña” en la pantalla de entrar.',
    noEmail: 'Sin correo',
    // An account is not access. Somebody who never opened the email cannot use
    // Zeker at all, and the list used to show them exactly like everyone else.
    neverSignedIn: 'Aún no ha entrado',
    neverSignedInHint:
      'Quien aparece como “Aún no ha entrado” todavía no ha creado su contraseña, así que no puede usar Zeker. Puede reenviarle el correo desde el menú de esa persona.',
    emailDeliveryNote:
      'El correo para crear la contraseña lo envía Firebase, no Zeker. Si no llega en unos minutos, pídale que revise la carpeta de correo no deseado (spam) y que busque el remitente “noreply”.',
    resend: 'Reenviar el correo',
    resent: 'Listo. Le enviamos otra vez el correo para crear su contraseña.',
    resendNoAccount:
      'Esa cuenta ya no existe en el sistema de acceso. Quite a la persona y vuelva a agregarla.',
    remove: 'Quitar de la organización',
    removeConfirmTitle: '¿Quitar a esta persona?',
    removeConfirmBody:
      'Deja de tener acceso a esta organización. Su cuenta no se borra: si pertenece a otra organización, allí sigue igual. Puede volver a agregarla después.',
    removeConflict:
      'No se puede quitar. Todavía es responsable de un interior. Ponga a otra persona a cargo de ese interior y vuelva a intentar.',
    removeSelf: 'No puede quitarse a usted mismo de la organización.',
    selfConflict: 'Usted ya es administrador de esta organización.',
    // The API answers the same way whether or not the account existed, so the
    // screen must not imply that it knows either.
    privacyNote:
      'Guardamos su nombre y el interior a su cargo. El correo lo guarda Firebase, no nosotros.',
  },

  permits: {
    // Decisión 018. Mismo motivo que en Personas, dicho para lo que aquí se
    // guarda: el nombre de un visitante, que es una persona real.
    waitingApprovalBody:
      'Un permiso guarda el nombre de quien entra, así que esperamos a revisar el edificio antes de crear el primero. Mientras tanto puede armar sus sedes y sus interiores.',
    title: 'Permisos de entrada',
    subtitle: 'Quién puede entrar, a dónde y hasta cuándo.',
    empty: 'Todavía no hay permisos.',
    emptyHint: 'Cree uno cuando espere una visita, un domicilio o un técnico.',
    emptyNoInterior:
      'Todavía no está a cargo de ningún interior, así que no puede crear permisos. Pídale al administrador que lo ponga a cargo de uno.',
    needsInterior: 'Primero agregue un interior. Un permiso siempre es para entrar a uno.',
    goToInteriors: 'Ir a interiores',

    add: 'Crear permiso',
    addFirst: 'Crear el primer permiso',
    adding: 'Creando…',

    visitorName: 'Nombre de quien entra',
    visitorNamePlaceholder: 'Ana Ruiz',
    // Says plainly what is kept, because the visitor never agreed to anything.
    visitorNameHint:
      'Solo su nombre. No pedimos cédula, teléfono ni foto, y no guardamos nada más de esa persona.',
    interior: 'A dónde entra',
    purpose: 'Motivo',
    purposeVisitor: 'Visita',
    purposePickup: 'Recoger a alguien',
    purposeProvider: 'Domicilio o proveedor',
    purposeEmployee: 'Trabajo o servicio',
    purposeOther: 'Otro',
    validFrom: 'Desde',
    validTo: 'Hasta',
    validHint: 'Fuera de estas fechas el código no sirve.',

    stateActive: 'Activo',
    stateScheduled: 'Programado',
    stateExpired: 'Vencido',
    stateRevoked: 'Anulado',
    // Decision 014. "Usado" outranks "vencido" on purpose: it says what
    // happened to the permit, not what the clock did.
    stateUsed: 'Ya se usó',

    entryMode: '¿Cuántas veces sirve?',
    entryModeSingle: 'Una sola entrada',
    entryModeSingleHint:
      'Deja de servir apenas la persona entre. Para una visita, un domicilio o una entrega.',
    entryModeMultiple: 'Entradas libres hasta que venza',
    entryModeMultipleHint:
      'La persona puede entrar y salir las veces que necesite. Para quien trabaja en el interior o viene varias veces el mismo día.',
    // Decision 016. The question is asked plainly, and the "no" option comes
    // first because most permits are for one visit and should cost no thought.
    schedule: '¿Sirve a cualquier hora?',
    scheduleAny: 'Sí, a cualquier hora',
    scheduleAnyHint: 'El permiso sirve todo el tiempo, hasta que se venza.',
    scheduleFixed: 'No, solo ciertos días y horas',
    scheduleFixedHint:
      'Para quien viene siempre: la persona del aseo, el jardinero, un domicilio de todos los días. Haga un permiso largo y déjelo servir solo cuando esa persona trabaja.',
    scheduleDays: 'Días',
    scheduleFrom: 'Desde las',
    scheduleTo: 'Hasta las',
    // The building's clock, not the reader's. A resident can be in another
    // country; the door is not.
    scheduleZoneNote: 'Las horas son las del edificio.',
    scheduleLabel: 'Días y horas',
    scheduleAlways: 'Cualquier día, a cualquier hora',
    // Written the way somebody would say it out loud.
    scheduleEveryDay: 'todos los días',
    scheduleWeekdays: 'de lunes a viernes',
    scheduleWeekend: 'fines de semana',
    scheduleAnd: 'y',
    scheduleTimeJoin: 'de',
    scheduleTimeTo: 'a',

    notUsedYet: 'Todavía no se ha usado',
    // Decision 015. The difference an administrator asked for: a permit nobody
    // ever used, and one whose visitor was turned around at the door.
    visitorNeverCame: 'El visitante no llegó a entrar',
    usedOnce: 'Entró el',
    usedTimes: 'Entradas registradas:',

    codeTitle: 'Código de entrada',
    open: 'Ver el permiso',
    codeHint: 'Muestre el código QR en la portería. Si la cámara no lo lee, dicte el número.',
    qrAlt: 'Código QR del permiso de entrada',
    copyCode: 'Copiar el número',
    copied: 'Copiado',
    downloadQr: 'Descargar el QR',
    qrFailed: 'No pudimos dibujar el código QR. Use el número de abajo.',
    shareHint: 'Envíele el QR o el número a la persona que va a entrar.',

    revoke: 'Anular el permiso',
    revokeConfirmTitle: '¿Anular este permiso?',
    revokeConfirmBody:
      'El código deja de servir de inmediato. El permiso se conserva en la historia de entradas, pero ya no abre nada. Esta acción no se puede deshacer.',
    revoked: 'Este permiso está anulado. Su código ya no sirve.',
    // Corregido 2026-09-04: la pantalla mostraba "ya terminó" para CUALQUIER
    // estado que no fuera "anulado" — incluido uno que ya se usó y uno que
    // todavía no empieza. "Terminó" y "se usó" no son lo mismo, y el Fundador
    // lo señaló el 2026-09-03: "se usó" dice qué le pasó al permiso, "venció"
    // solo dice qué hizo el reloj.
    expired: 'Este permiso ya se venció. Ya pasó la fecha hasta la que servía.',
    used: 'Este permiso era para una sola entrada y ya se usó. Haga uno nuevo si la persona tiene que volver.',
    scheduled: 'Este permiso todavía no empieza. Su código va a servir desde la fecha de inicio.',

    backToList: 'Volver a los permisos',
    filterAll: 'Todos',
    forInterior: 'Interior',
  },

  history: {
    title: 'Entradas',
    subtitle: 'Qué pasó en las puertas. Lo más reciente primero.',
    // A responsable sees only their own interiors, and is told so rather than
    // left to wonder whether the building is empty or the screen is hiding
    // something.
    subtitleResponsable: 'Lo que pasó en las puertas con sus interiores. Lo más reciente primero.',
    empty: 'Todavía no ha entrado nadie.',
    emptyFiltered: 'No hay nada que coincida con lo que buscó.',
    onlyDenied: 'Solo los rechazados',
    from: 'Desde',
    to: 'Hasta',
    clear: 'Quitar los filtros',
    more: 'Ver más',
    loadingMore: 'Cargando…',
    allowed: 'Entró',
    denied: 'No entró',
    at: 'en',
    // Decision 015: the guard's note, shown under the check it corrects.
    noteLine: 'El portero anotó:',
    entryReturned: 'Se le devolvió la entrada.',
    unknownVisitor: 'Sin permiso',
    retentionNote:
      'Las entradas se guardan 90 días y los rechazos 30. Después se borran solos.',
  },

  gate: {
    title: 'Portería',
    subtitle: 'Lea el código QR de la visita, o escriba el número.',

    entrance: 'Entrada donde está usted',
    entranceHint: 'Un permiso sirve solo en la entrada para la que se hizo.',
    entranceNone: 'Esta organización todavía no tiene sedes. Pídale una al administrador.',
    entranceChange: 'Cambiar de entrada',

    scan: 'Leer el código QR',
    scanning: 'Buscando el código…',
    scanStop: 'Detener la cámara',
    cameraDenied:
      'No tenemos permiso para usar la cámara. Actívelo en el navegador, o escriba el número.',
    cameraFailed: 'No pudimos abrir la cámara. Escriba el número.',
    cameraLive: 'Apunte la cámara al código QR de la visita.',

    codeLabel: 'Número del permiso',
    codePlaceholder: 'A1B2-C3D4',
    codeHint: 'Ocho caracteres. No importan mayúsculas, guiones ni espacios.',
    codeRequired: 'Escriba o lea un código.',
    submit: 'Verificar',
    submitting: 'Verificando…',
    again: 'Verificar otro',

    allowed: 'Puede entrar',
    denied: 'No puede entrar',

    // Each refusal says which one it is. A guard who only hears "no" cannot
    // explain anything to the person standing in front of them.
    reasonInvalidCode: 'Ese código no existe. Revise que esté bien escrito.',
    reasonRevoked: 'El permiso fue anulado por quien lo creó.',
    // Decision 014. This one has a second sentence because, unlike the others,
    // there is something the person at the gate can do about it.
    reasonAlreadyUsed:
      'Este permiso era para una sola entrada y ya se usó. Pídale al residente que haga uno nuevo.',
    reasonNotStarted: 'El permiso todavía no empieza.',
    reasonExpired: 'El permiso ya terminó.',
    reasonWrongLocation: 'Ese permiso no es para esta entrada.',
    // Decision 016. Like "ya se usó", this one has something the guard can act
    // on: the visitor is not being turned away for good, only for now.
    // Corregido 2026-09-04 después de correr TC-016-01 a mano. Decía "no sirve
    // a esta hora" también cuando el día era el equivocado, y un vigilante de
    // afán mira el reloj en vez del calendario. Ahora nombra las dos cosas.
    reasonOutsideSchedule: 'Este permiso no sirve en este día ni a esta hora.',
    /** Followed by the schedule itself, so the guard can say when to come back. */
    scheduleAllows: 'Sirve',
    rightEntrance: 'Es para',

    goingTo: 'Va a',
    validUntil: 'Vale hasta',
    recorded: 'Queda registrado.',

    // Decision 015. Four fixed reasons, never a free-text box: what lands in
    // a box like that at a real gate is cedulas, telefonos and descriptions
    // of people who agreed to nothing.
    noteTitle: '¿Pasó algo distinto?',
    noteHint: 'Toque una opción. Queda escrito con su nombre y la hora.',
    noteNoEntry: 'El visitante no entró',
    noteSentToOtherEntrance: 'Lo envié a otra entrada',
    noteReturningLater: 'Dijo que vuelve más tarde',
    noteAskedResident: 'Pedí confirmación al residente',
    noteSaving: 'Guardando…',
    // Two different confirmations, because two different things happened.
    noteSavedReturned: 'Listo. El permiso vuelve a servir.',
    noteSaved: 'Listo. Queda escrito.',
    noteTooLate:
      'Pasaron más de 10 minutos desde la revisión. Pídale al residente que haga un permiso nuevo.',
    noteAlready: 'Ya se anotó algo sobre esta revisión.',
  },

  usage: {
    locationsLabel: 'Sedes',
    interiorsLabel: 'Interiores',
    of: 'de',
    full: 'Alcanzó el límite de su plan.',
    interiorsNote: 'Contados en toda la organización, no por sede.',
  },

  actions: {
    edit: 'Cambiar',
    save: 'Guardar',
    saving: 'Guardando…',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    deleting: 'Eliminando…',
    options: 'Opciones',
    retry: 'Reintentar',
  },

  errors: {
    // Shown when we genuinely do not know what went wrong.
    unknown: 'Algo salió mal. Intente de nuevo en un momento.',
    network:
      'No pudimos conectar. Revise su conexión a internet e intente de nuevo.',
    // Sign-in failures are deliberately not specific: telling someone that the
    // email exists but the password is wrong confirms who has an account here.
    badCredentials: 'Correo o contraseña incorrectos.',
    emailInUse: 'Ya existe una cuenta con ese correo.',
    weakPassword: 'Esa contraseña es muy débil. Use al menos 8 caracteres.',
    tooManyAttempts:
      'Demasiados intentos. Espere unos minutos antes de volver a intentar.',
    accountDisabled: 'Esta cuenta está deshabilitada. Contacte al soporte.',
    sessionExpired: 'Su sesión terminó. Entre de nuevo.',
    // A password link is good for about an hour, and asking for a new one
    // cancels the previous one. Both facts were invisible until 2026-09-01,
    // when the Founder was locked out by a dead link that explained neither.
    // Wording to be reviewed by Content Strategist / Copywriter.
    expiredLink:
      'Ese enlace ya venció o fue reemplazado por uno más nuevo. Pida uno nuevo y ábralo dentro de la hora siguiente.',
    invalidLink:
      'Ese enlace no es válido. Puede que se haya cortado al copiarlo. Pida uno nuevo.',
    // Found 2026-09-02: the same product answers on two Cloud Run addresses and
    // only one of them was allowed to reach Firebase. From the other one every
    // sign-in and every password request failed as `unknown` — "intente de
    // nuevo en un momento" — so the Founder retried for a while against
    // something that was never going to work. Waiting is not the answer here.
    // Wording to be reviewed by Content Strategist / Copywriter.
    originBlocked:
      'Está abriendo Zeker desde una dirección que no está autorizada, y por eso no podemos entrar. Vuelva a intentar desde la dirección oficial de Zeker; esperar no lo va a resolver. Si llegó por un enlace guardado, pida el enlace correcto al administrador.',
    notAllowed: 'No tiene permiso para hacer esto.',
    notFound: 'No encontramos lo que buscaba.',
    invalidRequest: 'Los datos enviados no son válidos. Revíselos.',
    // Decisión 018. Ni "no tiene permiso" ni "algo salió mal": ninguna de las
    // dos es cierta, y las dos mandan a la persona a buscar donde no es.
    orgNotApproved:
      'Todavía estamos revisando este edificio. Mientras tanto puede armar sus sedes y sus interiores.',
    // R-02. Su propio mensaje, porque tiene una acción distinta a la del
    // límite del plan: aquí no hay que cambiar de plan, hay que esperar.
    inviteLimitReached:
      'Ya agregó todas las personas que se pueden agregar hoy en esta organización. Puede seguir mañana.',
    quotaExceeded:
      'Alcanzó el límite de su plan. Mejore su plan para agregar más.',
    conflict: 'Esa acción choca con algo que ya existe.',
    serverError:
      'Tuvimos un problema en nuestro servidor. Intente de nuevo en un momento.',
    signOutFailed:
      'No pudimos cerrar su sesión por completo. Intente de nuevo antes de dejar este dispositivo.',
  },
} as const

export type Strings = typeof es
