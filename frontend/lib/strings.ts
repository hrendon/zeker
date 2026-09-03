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
    greeting: 'Hola',
    roleLabel: 'Rol',
  },

  roles: {
    admin: 'Administrador',
    responsable: 'Responsable',
    security: 'Seguridad',
  },

  validation: {
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
    notUsedYet: 'Todavía no se ha usado',
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
    expired: 'Este permiso ya terminó.',
    scheduled: 'Este permiso todavía no empieza.',

    backToList: 'Volver a los permisos',
    filterAll: 'Todos',
    forInterior: 'Interior',
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
    rightEntrance: 'Es para',

    goingTo: 'Va a',
    validUntil: 'Vale hasta',
    recorded: 'Queda registrado.',
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
