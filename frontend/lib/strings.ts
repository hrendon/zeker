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
    yourOrgs: 'Sus organizaciones',
    noOrgs: 'Todavía no pertenece a ninguna organización.',
    noOrgsHint:
      'El siguiente paso será crear una organización. Esa pantalla aún no existe.',
    roleLabel: 'Rol',
    underConstruction:
      'Esta pantalla es temporal. Confirma que entrar, salir y leer su perfil funcionan de extremo a extremo.',
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
