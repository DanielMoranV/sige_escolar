export enum RolUsuario {
  SUPER_ADMIN = 'SUPER_ADMIN',
  DIRECTOR = 'DIRECTOR',
  SUBDIRECTOR = 'SUBDIRECTOR',
  DOCENTE_TUTOR = 'DOCENTE_TUTOR',
  DOCENTE_AREA = 'DOCENTE_AREA',
  SECRETARIA = 'SECRETARIA',
  APODERADO = 'APODERADO',
  ESTUDIANTE = 'ESTUDIANTE',
}

export enum NivelEducativo {
  INICIAL = 'INICIAL',
  PRIMARIA = 'PRIMARIA',
  SECUNDARIA = 'SECUNDARIA',
}

export enum TipoRegimen {
  BIMESTRAL = 'BIMESTRAL',
  TRIMESTRAL = 'TRIMESTRAL',
  SEMESTRAL = 'SEMESTRAL',
}

export enum TipoMatricula {
  CONTINUIDAD = 'CONTINUIDAD',
  INGRESO = 'INGRESO',
  REINCORPORACION = 'REINCORPORACION',
  TRASLADO = 'TRASLADO',
}

export enum EstadoMatricula {
  ACTIVA = 'ACTIVA',
  RETIRADA = 'RETIRADA',
  TRASLADADA = 'TRASLADADA',
}

export enum EstadoAsistencia {
  P = 'P',    // Presente
  T = 'T',    // Tardanza
  FI = 'FI',  // Falta injustificada
  FJ = 'FJ',  // Falta justificada
  PS = 'PS',  // Permiso con salida
  LM = 'LM',  // Licencia médica
  NM = 'NM',  // No matriculado (días anteriores a la matrícula)
}

export enum CalificativoLiteral {
  AD = 'AD',
  A = 'A',
  B = 'B',
  C = 'C',
  EXO = 'EXO',
}

export enum TipoDia {
  LECTIVO = 'LECTIVO',
  GESTION = 'GESTION',
  FERIADO = 'FERIADO',
  VACACION = 'VACACION',
  SUSPENSION = 'SUSPENSION',
  ACTIVIDAD = 'ACTIVIDAD',
}

export enum PlanTenant {
  BASICO = 'basico',
  PROFESIONAL = 'profesional',
  ENTERPRISE = 'enterprise',
}

export enum TipoGestion {
  PUBLICA = 'PUBLICA',
  PRIVADA = 'PRIVADA',
  CONVENIO = 'CONVENIO',
}
