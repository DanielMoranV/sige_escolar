-- Tenant schema template
-- Replace all {SCHEMA} with the actual tenant slug before execution

CREATE TABLE {SCHEMA}.anio_escolar_config (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    anio            SMALLINT NOT NULL UNIQUE,
    fecha_inicio    DATE     NOT NULL,
    fecha_fin       DATE     NOT NULL,
    horas_minimas_primaria   SMALLINT NOT NULL DEFAULT 1100,
    horas_minimas_secundaria SMALLINT NOT NULL DEFAULT 1200,
    activo          BOOLEAN  NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE {SCHEMA}.tipo_regimen AS ENUM ('BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL');

CREATE TABLE {SCHEMA}.regimen_config (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    anio_escolar_id UUID     NOT NULL REFERENCES {SCHEMA}.anio_escolar_config(id),
    nivel           public.nivel_educativo NOT NULL,
    tipo_regimen    {SCHEMA}.tipo_regimen NOT NULL,
    UNIQUE (anio_escolar_id, nivel)
);

CREATE TYPE {SCHEMA}.estado_periodo AS ENUM ('FUTURO', 'ACTIVO', 'CERRADO', 'EXPORTADO');

CREATE TABLE {SCHEMA}.periodos (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    anio_escolar_id UUID     NOT NULL REFERENCES {SCHEMA}.anio_escolar_config(id),
    nivel           public.nivel_educativo NOT NULL,
    codigo          VARCHAR(10) NOT NULL,
    nombre          VARCHAR(50) NOT NULL,
    orden           SMALLINT NOT NULL,
    fecha_inicio    DATE     NOT NULL,
    fecha_fin       DATE     NOT NULL,
    estado          {SCHEMA}.estado_periodo NOT NULL DEFAULT 'FUTURO',
    cerrado_por     UUID     REFERENCES public.usuarios(id),
    cerrado_en      TIMESTAMPTZ,
    UNIQUE (anio_escolar_id, nivel, codigo)
);
CREATE INDEX idx_periodos_anio_nivel ON {SCHEMA}.periodos(anio_escolar_id, nivel);

CREATE TYPE {SCHEMA}.tipo_dia AS ENUM ('LECTIVO', 'GESTION', 'FERIADO', 'VACACION', 'SUSPENSION', 'ACTIVIDAD');

CREATE TABLE {SCHEMA}.calendario_escolar (
    id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    anio_escolar_id UUID    NOT NULL REFERENCES {SCHEMA}.anio_escolar_config(id),
    fecha           DATE    NOT NULL,
    tipo_dia        {SCHEMA}.tipo_dia NOT NULL DEFAULT 'LECTIVO',
    descripcion     VARCHAR(200),
    creado_por      UUID    REFERENCES public.usuarios(id),
    UNIQUE (anio_escolar_id, fecha)
);
CREATE INDEX idx_calendario_anio_tipo ON {SCHEMA}.calendario_escolar(anio_escolar_id, tipo_dia);
CREATE INDEX idx_calendario_fecha ON {SCHEMA}.calendario_escolar(fecha);

CREATE TABLE {SCHEMA}.grados (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    nivel           public.nivel_educativo NOT NULL,
    numero          SMALLINT NOT NULL,
    nombre          VARCHAR(30) NOT NULL,
    orden           SMALLINT NOT NULL,
    UNIQUE (nivel, numero)
);

CREATE TABLE {SCHEMA}.secciones (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    anio_escolar_id UUID     NOT NULL REFERENCES {SCHEMA}.anio_escolar_config(id),
    grado_id        UUID     NOT NULL REFERENCES {SCHEMA}.grados(id),
    nombre          VARCHAR(20) NOT NULL,
    turno           VARCHAR(10) NOT NULL DEFAULT 'MAÑANA',
    aforo_maximo    SMALLINT,
    activa          BOOLEAN  NOT NULL DEFAULT TRUE,
    UNIQUE (anio_escolar_id, grado_id, nombre)
);
CREATE INDEX idx_secciones_anio ON {SCHEMA}.secciones(anio_escolar_id);
CREATE INDEX idx_secciones_grado ON {SCHEMA}.secciones(grado_id);

CREATE TABLE {SCHEMA}.areas_ie (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    anio_escolar_id UUID     NOT NULL REFERENCES {SCHEMA}.anio_escolar_config(id),
    area_cneb_id    UUID     REFERENCES public.areas_cneb(id),
    nombre_display  VARCHAR(100) NOT NULL,
    codigo_display  VARCHAR(20),
    nivel           public.nivel_educativo NOT NULL,
    es_area_cneb    BOOLEAN  NOT NULL DEFAULT TRUE,
    orden           SMALLINT NOT NULL,
    permite_exoneracion BOOLEAN NOT NULL DEFAULT FALSE,
    es_calificable  BOOLEAN  NOT NULL DEFAULT TRUE,
    peso_area       DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    activa          BOOLEAN  NOT NULL DEFAULT TRUE,
    UNIQUE (anio_escolar_id, nombre_display, nivel)
);
CREATE INDEX idx_areas_ie_anio_nivel ON {SCHEMA}.areas_ie(anio_escolar_id, nivel);

CREATE TABLE {SCHEMA}.competencias_ie (
    id                  UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    area_ie_id          UUID     NOT NULL REFERENCES {SCHEMA}.areas_ie(id),
    competencia_cneb_id UUID     REFERENCES public.competencias_cneb(id),
    nombre_display      TEXT     NOT NULL,
    orden               SMALLINT NOT NULL,
    peso_competencia    DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    aplica_grados       SMALLINT[]  NOT NULL DEFAULT '{1,2,3,4,5,6}',
    activa              BOOLEAN  NOT NULL DEFAULT TRUE,
    UNIQUE (area_ie_id, orden)
);
CREATE INDEX idx_comp_ie_area ON {SCHEMA}.competencias_ie(area_ie_id);

CREATE TABLE {SCHEMA}.docentes (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id      UUID     NOT NULL REFERENCES public.usuarios(id),
    dni             VARCHAR(8) NOT NULL UNIQUE,
    nombres         VARCHAR(200) NOT NULL,
    apellidos       VARCHAR(200) NOT NULL,
    especialidad    VARCHAR(200),
    activo          BOOLEAN  NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE {SCHEMA}.docente_area_seccion (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    anio_escolar_id UUID     NOT NULL REFERENCES {SCHEMA}.anio_escolar_config(id),
    docente_id      UUID     NOT NULL REFERENCES {SCHEMA}.docentes(id),
    area_ie_id      UUID     NOT NULL REFERENCES {SCHEMA}.areas_ie(id),
    seccion_id      UUID     NOT NULL REFERENCES {SCHEMA}.secciones(id),
    es_tutor        BOOLEAN  NOT NULL DEFAULT FALSE,
    UNIQUE (anio_escolar_id, area_ie_id, seccion_id)
);
CREATE INDEX idx_das_docente ON {SCHEMA}.docente_area_seccion(docente_id);
CREATE INDEX idx_das_seccion ON {SCHEMA}.docente_area_seccion(seccion_id);
CREATE INDEX idx_das_area ON {SCHEMA}.docente_area_seccion(area_ie_id);

CREATE TABLE {SCHEMA}.estudiantes (
    id                  UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    dni                 VARCHAR(8) UNIQUE,
    tipo_documento      VARCHAR(20) NOT NULL DEFAULT 'DNI',
    numero_documento    VARCHAR(20) NOT NULL,
    codigo_siagie       VARCHAR(14) UNIQUE,
    apellido_paterno    VARCHAR(100) NOT NULL,
    apellido_materno    VARCHAR(100),
    nombres             VARCHAR(200) NOT NULL,
    fecha_nacimiento    DATE         NOT NULL,
    genero              CHAR(1)      NOT NULL,
    ubigeo_nacimiento   VARCHAR(6)   REFERENCES public.ubigeos(codigo),
    lengua_materna      VARCHAR(50)  DEFAULT 'CASTELLANO',
    etnia               VARCHAR(50),
    tiene_discapacidad  BOOLEAN      DEFAULT FALSE,
    tipo_discapacidad   VARCHAR(100),
    foto_url            VARCHAR(500),
    reniec_validado     BOOLEAN      NOT NULL DEFAULT FALSE,
    reniec_validado_en  TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);
CREATE INDEX idx_estudiantes_dni ON {SCHEMA}.estudiantes(dni) WHERE deleted_at IS NULL;
CREATE INDEX idx_estudiantes_nombres ON {SCHEMA}.estudiantes(apellido_paterno, apellido_materno);
CREATE INDEX idx_estudiantes_codigo_siagie ON {SCHEMA}.estudiantes(codigo_siagie);

CREATE TABLE {SCHEMA}.apoderados (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    dni             VARCHAR(8),
    tipo_documento  VARCHAR(20) NOT NULL DEFAULT 'DNI',
    numero_documento VARCHAR(20) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100),
    nombres         VARCHAR(200) NOT NULL,
    telefono        VARCHAR(20),
    email           VARCHAR(200),
    usuario_id      UUID     REFERENCES public.usuarios(id),
    activo          BOOLEAN  NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_apoderados_dni ON {SCHEMA}.apoderados(dni);

CREATE TYPE {SCHEMA}.parentesco AS ENUM ('PADRE', 'MADRE', 'ABUELO', 'ABUELA', 'HERMANO', 'HERMANA', 'TIO', 'TIA', 'APODERADO_LEGAL', 'OTRO');

CREATE TABLE {SCHEMA}.estudiante_apoderado (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id   UUID     NOT NULL REFERENCES {SCHEMA}.estudiantes(id),
    apoderado_id    UUID     NOT NULL REFERENCES {SCHEMA}.apoderados(id),
    parentesco      {SCHEMA}.parentesco NOT NULL,
    es_apoderado_principal BOOLEAN NOT NULL DEFAULT FALSE,
    vive_con_estudiante    BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (estudiante_id, apoderado_id)
);
CREATE INDEX idx_ea_estudiante ON {SCHEMA}.estudiante_apoderado(estudiante_id);
CREATE INDEX idx_ea_apoderado ON {SCHEMA}.estudiante_apoderado(apoderado_id);

CREATE TYPE {SCHEMA}.tipo_matricula AS ENUM ('CONTINUIDAD', 'INGRESO', 'REINCORPORACION', 'TRASLADO');
CREATE TYPE {SCHEMA}.condicion_matricula AS ENUM ('PROMOVIDO', 'REPITE', 'INGRESANTE');
CREATE TYPE {SCHEMA}.estado_matricula AS ENUM ('ACTIVA', 'RETIRADA', 'TRASLADADA');

CREATE TABLE {SCHEMA}.matriculas (
    id                  UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    anio_escolar_id     UUID     NOT NULL REFERENCES {SCHEMA}.anio_escolar_config(id),
    estudiante_id       UUID     NOT NULL REFERENCES {SCHEMA}.estudiantes(id),
    seccion_id          UUID     NOT NULL REFERENCES {SCHEMA}.secciones(id),
    tipo_matricula      {SCHEMA}.tipo_matricula      NOT NULL DEFAULT 'CONTINUIDAD',
    condicion_matricula {SCHEMA}.condicion_matricula NOT NULL DEFAULT 'PROMOVIDO',
    estado              {SCHEMA}.estado_matricula    NOT NULL DEFAULT 'ACTIVA',
    fecha_matricula     DATE     NOT NULL,
    fecha_inicio        DATE     NOT NULL,
    fecha_retiro        DATE,
    motivo_retiro       VARCHAR(200),
    ie_procedencia      VARCHAR(200),
    codigo_modular_procedencia VARCHAR(7),
    rd_nomina_numero    VARCHAR(50),
    rd_nomina_fecha     DATE,
    repeticiones_en_nivel SMALLINT NOT NULL DEFAULT 0,
    resultado_final     VARCHAR(20),
    registrado_por      UUID     REFERENCES public.usuarios(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (anio_escolar_id, estudiante_id)
);
CREATE INDEX idx_matriculas_anio ON {SCHEMA}.matriculas(anio_escolar_id);
CREATE INDEX idx_matriculas_estudiante ON {SCHEMA}.matriculas(estudiante_id);
CREATE INDEX idx_matriculas_seccion ON {SCHEMA}.matriculas(seccion_id);
CREATE INDEX idx_matriculas_estado ON {SCHEMA}.matriculas(estado);

CREATE TABLE {SCHEMA}.exoneraciones (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula_id    UUID     NOT NULL REFERENCES {SCHEMA}.matriculas(id),
    area_ie_id      UUID     NOT NULL REFERENCES {SCHEMA}.areas_ie(id),
    tipo            VARCHAR(20) NOT NULL,
    motivo          VARCHAR(200) NOT NULL,
    documento_url   VARCHAR(500),
    fecha_solicitud DATE     NOT NULL,
    aprobada        BOOLEAN  NOT NULL DEFAULT FALSE,
    aprobada_por    UUID     REFERENCES public.usuarios(id),
    UNIQUE (matricula_id, area_ie_id)
);

CREATE TYPE {SCHEMA}.calificativo_literal AS ENUM ('AD', 'A', 'B', 'C', 'EXO', 'NR');

CREATE TABLE {SCHEMA}.notas_periodo (
    id                  UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula_id        UUID     NOT NULL REFERENCES {SCHEMA}.matriculas(id),
    competencia_ie_id   UUID     NOT NULL REFERENCES {SCHEMA}.competencias_ie(id),
    periodo_id          UUID     NOT NULL REFERENCES {SCHEMA}.periodos(id),
    calificativo_literal  {SCHEMA}.calificativo_literal,
    calificativo_numerico SMALLINT,
    conclusion_descriptiva TEXT,
    registrado_por      UUID     NOT NULL REFERENCES public.usuarios(id),
    registrado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ultima_modificacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por      UUID     REFERENCES public.usuarios(id),
    UNIQUE (matricula_id, competencia_ie_id, periodo_id)
);
CREATE INDEX idx_notas_matricula ON {SCHEMA}.notas_periodo(matricula_id);
CREATE INDEX idx_notas_competencia ON {SCHEMA}.notas_periodo(competencia_ie_id);
CREATE INDEX idx_notas_periodo ON {SCHEMA}.notas_periodo(periodo_id);
CREATE INDEX idx_notas_periodo_comp ON {SCHEMA}.notas_periodo(periodo_id, competencia_ie_id);

CREATE TABLE {SCHEMA}.cierre_periodo (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    periodo_id      UUID     NOT NULL REFERENCES {SCHEMA}.periodos(id),
    seccion_id      UUID     NOT NULL REFERENCES {SCHEMA}.secciones(id),
    estado          {SCHEMA}.estado_periodo NOT NULL DEFAULT 'ACTIVO',
    notas_completas BOOLEAN  NOT NULL DEFAULT FALSE,
    porcentaje_notas_completas SMALLINT NOT NULL DEFAULT 0,
    cerrado_por     UUID     REFERENCES public.usuarios(id),
    cerrado_en      TIMESTAMPTZ,
    UNIQUE (periodo_id, seccion_id)
);

CREATE TYPE {SCHEMA}.resultado_anio AS ENUM ('PROMOVIDO', 'PERMANECE', 'RECUPERACION', 'RETIRADO', 'POSTERGADO');

CREATE TABLE {SCHEMA}.cierre_anio (
    id                  UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula_id        UUID     NOT NULL REFERENCES {SCHEMA}.matriculas(id) UNIQUE,
    resultado           {SCHEMA}.resultado_anio,
    promedios_areas     JSONB,
    areas_recuperacion  JSONB,
    resultado_recuperacion {SCHEMA}.resultado_anio,
    notas_recuperacion  JSONB,
    calculado_en        TIMESTAMPTZ,
    calculado_por       UUID     REFERENCES public.usuarios(id),
    revisado_director   BOOLEAN  NOT NULL DEFAULT FALSE,
    revisado_en         TIMESTAMPTZ,
    es_caso_especial    BOOLEAN  NOT NULL DEFAULT FALSE,
    justificacion_caso  TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cierre_anio_resultado ON {SCHEMA}.cierre_anio(resultado);

CREATE TABLE {SCHEMA}.recuperacion_matricula (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula_id    UUID     NOT NULL REFERENCES {SCHEMA}.matriculas(id),
    area_ie_id      UUID     NOT NULL REFERENCES {SCHEMA}.areas_ie(id),
    notas_recuperacion JSONB,
    resultado_area  VARCHAR(10),
    docente_id      UUID     REFERENCES {SCHEMA}.docentes(id),
    fecha_evaluacion DATE,
    UNIQUE (matricula_id, area_ie_id)
);

CREATE TYPE {SCHEMA}.estado_asistencia AS ENUM ('PRESENTE', 'TARDANZA', 'FALTA_INJUSTIFICADA', 'FALTA_JUSTIFICADA', 'LICENCIA');

CREATE TABLE {SCHEMA}.asistencia_diaria (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula_id    UUID     NOT NULL REFERENCES {SCHEMA}.matriculas(id),
    fecha           DATE     NOT NULL,
    estado          {SCHEMA}.estado_asistencia NOT NULL,
    hora_llegada    TIME,
    minutos_tardanza SMALLINT DEFAULT 0,
    observacion     VARCHAR(200),
    registrado_por  UUID     NOT NULL REFERENCES public.usuarios(id),
    registrado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_en   TIMESTAMPTZ,
    UNIQUE (matricula_id, fecha)
);
CREATE INDEX idx_asistencia_matricula ON {SCHEMA}.asistencia_diaria(matricula_id);
CREATE INDEX idx_asistencia_fecha ON {SCHEMA}.asistencia_diaria(fecha);
CREATE INDEX idx_asistencia_estado ON {SCHEMA}.asistencia_diaria(matricula_id, estado);

CREATE TYPE {SCHEMA}.estado_justificacion AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'VENCIDA');

CREATE TABLE {SCHEMA}.justificaciones (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    asistencia_id   UUID     NOT NULL REFERENCES {SCHEMA}.asistencia_diaria(id),
    tipo            VARCHAR(50) NOT NULL,
    motivo          TEXT     NOT NULL,
    documento_url   VARCHAR(500),
    estado          {SCHEMA}.estado_justificacion NOT NULL DEFAULT 'PENDIENTE',
    plazo_vencimiento DATE   NOT NULL,
    revisado_por    UUID     REFERENCES public.usuarios(id),
    revisado_en     TIMESTAMPTZ,
    observacion_revision VARCHAR(200),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_justif_asistencia ON {SCHEMA}.justificaciones(asistencia_id);
CREATE INDEX idx_justif_estado ON {SCHEMA}.justificaciones(estado);

CREATE TYPE {SCHEMA}.nivel_alerta AS ENUM ('VERDE', 'AMARILLO', 'NARANJA', 'ROJO');

CREATE TABLE {SCHEMA}.alertas_asistencia (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula_id    UUID     NOT NULL REFERENCES {SCHEMA}.matriculas(id) UNIQUE,
    nivel_alerta    {SCHEMA}.nivel_alerta NOT NULL DEFAULT 'VERDE',
    porcentaje_asistencia DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    faltas_injustificadas SMALLINT NOT NULL DEFAULT 0,
    tardanzas_acumuladas  SMALLINT NOT NULL DEFAULT 0,
    ultima_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notificado_en   TIMESTAMPTZ,
    atendida        BOOLEAN  NOT NULL DEFAULT FALSE,
    atendida_por    UUID     REFERENCES public.usuarios(id),
    atendida_en     TIMESTAMPTZ,
    observacion_atencion VARCHAR(500)
);
CREATE INDEX idx_alertas_nivel ON {SCHEMA}.alertas_asistencia(nivel_alerta);

-- Configuración de umbrales de asistencia (RM 281-2016-MINEDU: 30% inasistencias → repitencia)
CREATE TABLE IF NOT EXISTS {SCHEMA}.config_asistencia (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    anio_escolar_id     UUID         NOT NULL REFERENCES {SCHEMA}.anio_escolar_config(id) UNIQUE,
    tardanzas_por_falta SMALLINT     NOT NULL DEFAULT 3,
    umbral_amarillo     DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    umbral_naranja      DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    umbral_rojo         DECIMAL(5,2) NOT NULL DEFAULT 30.00,
    contar_tardanzas    BOOLEAN      NOT NULL DEFAULT TRUE,
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TYPE {SCHEMA}.estado_sync AS ENUM ('PENDIENTE', 'GENERADO', 'ENVIADO', 'CONFIRMADO', 'ERROR');

CREATE TABLE {SCHEMA}.siagie_sync_log (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    modulo          VARCHAR(30) NOT NULL,
    periodo_id      UUID     REFERENCES {SCHEMA}.periodos(id),
    anio_escolar_id UUID     REFERENCES {SCHEMA}.anio_escolar_config(id),
    estado          {SCHEMA}.estado_sync NOT NULL DEFAULT 'PENDIENTE',
    archivo_url     VARCHAR(500),
    generado_por    UUID     REFERENCES public.usuarios(id),
    generado_en     TIMESTAMPTZ,
    enviado_en      TIMESTAMPTZ,
    notas           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE {SCHEMA}.informe_progreso_entrega (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula_id    UUID     NOT NULL REFERENCES {SCHEMA}.matriculas(id),
    periodo_id      UUID     NOT NULL REFERENCES {SCHEMA}.periodos(id),
    entregado       BOOLEAN  NOT NULL DEFAULT FALSE,
    fecha_entrega   DATE,
    firma_apoderado BOOLEAN  NOT NULL DEFAULT FALSE,
    observacion     VARCHAR(200),
    UNIQUE (matricula_id, periodo_id)
);

CREATE TABLE {SCHEMA}.notificaciones (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id      UUID     NOT NULL REFERENCES public.usuarios(id),
    tipo            VARCHAR(50) NOT NULL,
    titulo          VARCHAR(200) NOT NULL,
    mensaje         TEXT     NOT NULL,
    leida           BOOLEAN  NOT NULL DEFAULT FALSE,
    leida_en        TIMESTAMPTZ,
    datos_extra     JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notif_usuario ON {SCHEMA}.notificaciones(usuario_id, leida);
