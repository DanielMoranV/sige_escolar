# Documento 6 — Schema de Base de Datos
## Sistema de Gestión Escolar · Educación Básica Regular (EBR) · Perú

> **Serie:** Contexto Legal y Técnico para Sistema Multitenant de Gestión Escolar Peruana  
> **Documento:** 6 de 6  
> **Stack:** NestJS · Prisma ORM · PostgreSQL 16 · Schema por tenant  
> **Última revisión:** Marzo 2026  

---

## 1. Arquitectura del modelo de datos

### 1.1 División de schemas

```
PostgreSQL
├── schema: public                    ← Datos compartidos entre todos los tenants
│   ├── tenants                       ← Catálogo de colegios
│   ├── tenant_datos_minedu           ← Código modular, DRE, UGEL, director
│   ├── tenant_pdf_config             ← Personalización de documentos por colegio
│   ├── usuarios                      ← Usuarios del sistema (todos los colegios)
│   ├── ubigeos                       ← Tabla INEI de departamentos/provincias/distritos
│   ├── areas_cneb                    ← Áreas curriculares oficiales MINEDU
│   ├── competencias_cneb             ← Competencias por área y nivel
│   └── feriados_nacionales           ← Feriados del año (referencia nacional)
│
├── schema: {tenant_slug}             ← Un schema por colegio
│   ├── anio_escolar_config           ← Configuración del año escolar
│   ├── regimen_config                ← Bimestral / trimestral / semestral
│   ├── periodos                      ← Periodos del año escolar
│   ├── calendario_escolar            ← Días lectivos, feriados, suspensiones
│   ├── niveles                       ← Primaria / Secundaria (config por IE)
│   ├── grados                        ← 1° al 6° (primaria) / 1° al 5° (secund.)
│   ├── secciones                     ← A, B, C... por grado y año
│   ├── areas_ie                      ← Áreas del colegio (CNEB + libre disposic.)
│   ├── competencias_ie               ← Competencias activas por área en la IE
│   ├── docentes                      ← Docentes de la IE
│   ├── docente_area_seccion          ← Asignación docente→área→sección
│   ├── estudiantes                   ← Datos personales del estudiante
│   ├── apoderados                    ← Padres / apoderados
│   ├── estudiante_apoderado          ← Relación estudiante ↔ apoderado
│   ├── matriculas                    ← Matrícula por año y sección
│   ├── exoneraciones                 ← Exoneraciones Ed. Física / Religión
│   ├── notas_periodo                 ← Calificativos por competencia y periodo
│   ├── asistencia_diaria             ← Registro diario de asistencia
│   ├── justificaciones               ← Justificaciones de inasistencias
│   ├── alertas_asistencia            ← Alertas de riesgo de abandono
│   ├── cierre_periodo                ← Control de cierre de periodos
│   ├── cierre_anio                   ← Resultados del cierre anual
│   ├── recuperacion_matricula        ← Estudiantes en programa de recuperación
│   ├── siagie_sync_log               ← Estado de sincronización con SIAGIE
│   ├── informe_progreso_entrega      ← Control de entrega de libretas
│   └── notificaciones                ← Historial de notificaciones enviadas
```

### 1.2 Convenciones del schema

```
- UUIDs como PK en todas las tablas (gen_random_uuid())
- created_at / updated_at en todas las tablas
- deleted_at para soft delete donde aplique
- snake_case para nombres de columnas y tablas
- Enums de PostgreSQL para valores fijos (estado, tipo, etc.)
- Índices en todas las FKs y columnas de búsqueda frecuente
```

---

## 2. Schema PUBLIC — Tablas compartidas

### 2.1 tenants

```sql
CREATE TABLE public.tenants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(50)  NOT NULL UNIQUE,
    -- Slug usado como nombre del schema PostgreSQL: ej 'colegio_san_jose'
    -- Solo letras, números y guiones bajos. Sin espacios.

    nombre          VARCHAR(200) NOT NULL,
    nombre_corto    VARCHAR(80),
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    plan            VARCHAR(30)  NOT NULL DEFAULT 'basico',
    -- basico | profesional | enterprise

    schema_name     VARCHAR(63)  NOT NULL UNIQUE,
    -- Nombre del schema PostgreSQL — igual al slug pero validado
    -- Máximo 63 chars (límite PostgreSQL para identificadores)

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_activo ON public.tenants(activo);
```

### 2.2 tenant_datos_minedu

```sql
CREATE TABLE public.tenant_datos_minedu (
    tenant_id           UUID PRIMARY KEY REFERENCES public.tenants(id),

    -- Identificadores oficiales MINEDU
    codigo_modular      VARCHAR(7)   NOT NULL,
    anexo               VARCHAR(5)   NOT NULL DEFAULT '0',
    codigo_local        VARCHAR(10),
    nombre_oficial      VARCHAR(200) NOT NULL,
    -- Nombre exacto tal como figura en ESCALE y el SIAGIE

    -- Jurisdicción
    dre_codigo          VARCHAR(10),
    dre_nombre          VARCHAR(200),
    ugel_codigo         VARCHAR(10),
    ugel_nombre         VARCHAR(200),
    ubigeo_distrito     VARCHAR(6),
    -- FK opcional a public.ubigeos

    -- Tipo de gestión
    tipo_gestion        VARCHAR(20)  NOT NULL DEFAULT 'PRIVADA',
    -- PUBLICA | PRIVADA | CONVENIO
    modalidad           VARCHAR(10)  NOT NULL DEFAULT 'EBR',

    -- Director vigente
    director_dni        VARCHAR(8),
    director_nombres    VARCHAR(200),
    director_apellidos  VARCHAR(200),
    director_cargo      VARCHAR(100) NOT NULL DEFAULT 'Director(a)',
    firma_url           VARCHAR(500),
    -- URL del archivo de firma escaneada (S3/R2)

    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_tdm_codigo_modular ON public.tenant_datos_minedu(codigo_modular, anexo);
```

### 2.3 tenant_pdf_config

```sql
CREATE TABLE public.tenant_pdf_config (
    tenant_id               UUID PRIMARY KEY REFERENCES public.tenants(id),
    logo_url                VARCHAR(500),
    color_primario          VARCHAR(7)   DEFAULT '#1A5276',
    color_secundario        VARCHAR(7)   DEFAULT '#2E86C1',
    nombre_director_display VARCHAR(200),
    pie_documento           TEXT,
    mostrar_foto_estudiante BOOLEAN      DEFAULT FALSE,
    incluir_asistencia      BOOLEAN      DEFAULT TRUE,
    incluir_firma_apoderado BOOLEAN      DEFAULT TRUE,
    escala_interna          VARCHAR(20),
    -- NULL = usa escala oficial MINEDU
    -- 'NUMERICA_0_20' = muestra escala numérica en primaria (internamente)
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### 2.4 usuarios

```sql
CREATE TYPE public.rol_usuario AS ENUM (
    'SUPER_ADMIN',     -- Administrador del sistema SaaS
    'DIRECTOR',        -- Director de la IE
    'SUBDIRECTOR',
    'DOCENTE_TUTOR',
    'DOCENTE_AREA',
    'SECRETARIA',
    'APODERADO',
    'ESTUDIANTE'
);

CREATE TABLE public.usuarios (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID         NOT NULL REFERENCES public.tenants(id),
    email           VARCHAR(200) NOT NULL,
    password_hash   VARCHAR(200) NOT NULL,
    rol             public.rol_usuario NOT NULL,
    nombres         VARCHAR(200) NOT NULL,
    apellidos       VARCHAR(200) NOT NULL,
    dni             VARCHAR(15),
    telefono        VARCHAR(20),
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    ultimo_acceso   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_usuarios_email_tenant
    ON public.usuarios(email, tenant_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_usuarios_tenant ON public.usuarios(tenant_id);
CREATE INDEX idx_usuarios_rol ON public.usuarios(tenant_id, rol);
```

### 2.5 ubigeos

```sql
CREATE TABLE public.ubigeos (
    codigo          VARCHAR(6)   PRIMARY KEY,
    -- Formato INEI: DDPPDD (Departamento+Provincia+Distrito)
    -- '000000' = nivel departamento cuando prov/dist = '00'
    departamento    VARCHAR(100) NOT NULL,
    provincia       VARCHAR(100),
    distrito        VARCHAR(100),
    nivel           VARCHAR(15)  NOT NULL
    -- 'DEPARTAMENTO' | 'PROVINCIA' | 'DISTRITO'
);

-- Cargado con el dataset oficial INEI (1,874 distritos aprox.)
```

### 2.6 areas_cneb

```sql
CREATE TYPE public.nivel_educativo AS ENUM ('PRIMARIA', 'SECUNDARIA', 'INICIAL');

CREATE TABLE public.areas_cneb (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo          VARCHAR(20)  NOT NULL UNIQUE,
    -- ej: 'COM' (Comunicación), 'MAT' (Matemática), 'CS' (Ciencias Sociales)
    nombre          VARCHAR(100) NOT NULL,
    nivel           public.nivel_educativo NOT NULL,
    orden           SMALLINT     NOT NULL,
    -- Orden en que aparece en documentos oficiales
    permite_exoneracion BOOLEAN  NOT NULL DEFAULT FALSE,
    es_calificable  BOOLEAN      NOT NULL DEFAULT TRUE,
    -- FALSE para Tutoría (solo registro cualitativo)
    activo          BOOLEAN      NOT NULL DEFAULT TRUE
);

-- Datos semilla: las 8 áreas de primaria y 10 de secundaria del CNEB
-- Ver Documento 2 para la lista completa
```

### 2.7 competencias_cneb

```sql
CREATE TABLE public.competencias_cneb (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_id         UUID         NOT NULL REFERENCES public.areas_cneb(id),
    codigo          VARCHAR(30)  NOT NULL UNIQUE,
    -- ej: 'COM-ORAL', 'COM-LECTURA', 'COM-ESCRITURA'
    nombre          TEXT         NOT NULL,
    orden           SMALLINT     NOT NULL,
    -- Orden dentro del área — crítico para Excel del SIAGIE
    aplica_grados   SMALLINT[]   NOT NULL DEFAULT '{1,2,3,4,5,6}',
    -- Array de grados donde aplica esta competencia
    -- ej: algunas competencias solo aplican a ciertos grados
    activo          BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_comp_cneb_area ON public.competencias_cneb(area_id);
CREATE UNIQUE INDEX idx_comp_cneb_orden ON public.competencias_cneb(area_id, orden);
```

### 2.8 feriados_nacionales

```sql
CREATE TABLE public.feriados_nacionales (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha       DATE    NOT NULL,
    nombre      VARCHAR(100) NOT NULL,
    anio        SMALLINT NOT NULL,
    obligatorio BOOLEAN NOT NULL DEFAULT TRUE
    -- FALSE = feriados regionales opcionales
);

CREATE UNIQUE INDEX idx_feriados_fecha ON public.feriados_nacionales(fecha);
```

---

## 3. Schema TENANT — Configuración del año escolar

> Todas las tablas de esta sección viven en el schema `{tenant_slug}`.  
> Los ejemplos usan el prefijo `t.` para indicar "schema del tenant".

### 3.1 anio_escolar_config

```sql
CREATE TABLE t.anio_escolar_config (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    anio            SMALLINT NOT NULL UNIQUE,
    -- Año escolar: 2025, 2026, etc.

    fecha_inicio    DATE     NOT NULL,
    fecha_fin       DATE     NOT NULL,

    horas_minimas_primaria   SMALLINT NOT NULL DEFAULT 1100,
    horas_minimas_secundaria SMALLINT NOT NULL DEFAULT 1200,

    activo          BOOLEAN  NOT NULL DEFAULT TRUE,
    -- Solo un año puede estar activo a la vez

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.2 regimen_config

```sql
CREATE TYPE t.tipo_regimen AS ENUM ('BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL');

CREATE TABLE t.regimen_config (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    anio_escolar_id UUID     NOT NULL REFERENCES t.anio_escolar_config(id),
    nivel           public.nivel_educativo NOT NULL,
    tipo_regimen    t.tipo_regimen NOT NULL,
    -- Un colegio puede tener régimen distinto para primaria y secundaria

    UNIQUE (anio_escolar_id, nivel)
);
```

### 3.3 periodos

```sql
CREATE TYPE t.estado_periodo AS ENUM (
    'FUTURO',       -- Aún no inicia
    'ACTIVO',       -- En curso, el docente puede ingresar notas
    'CERRADO',      -- Director lo cerró, notas bloqueadas para docentes
    'EXPORTADO'     -- Excel generado y subido al SIAGIE
);

CREATE TABLE t.periodos (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    anio_escolar_id UUID     NOT NULL REFERENCES t.anio_escolar_config(id),
    nivel           public.nivel_educativo NOT NULL,
    codigo          VARCHAR(10) NOT NULL,
    -- ej: 'BIM1', 'BIM2', 'TRIM1', 'SEM1', 'RECUPERACION', 'ANUAL'
    nombre          VARCHAR(50) NOT NULL,
    -- ej: 'Primer Bimestre', 'Trimestre 1'
    orden           SMALLINT NOT NULL,
    fecha_inicio    DATE     NOT NULL,
    fecha_fin       DATE     NOT NULL,
    estado          t.estado_periodo NOT NULL DEFAULT 'FUTURO',
    cerrado_por     UUID     REFERENCES public.usuarios(id),
    cerrado_en      TIMESTAMPTZ,

    UNIQUE (anio_escolar_id, nivel, codigo)
);

CREATE INDEX idx_periodos_anio_nivel ON t.periodos(anio_escolar_id, nivel);
```

### 3.4 calendario_escolar

```sql
CREATE TYPE t.tipo_dia AS ENUM (
    'LECTIVO',
    'GESTION',       -- Semana de gestión sin estudiantes
    'FERIADO',
    'VACACION',
    'SUSPENSION',    -- Suspensión de clases (lluvia, emergencia, etc.)
    'ACTIVIDAD'      -- Actividad extracurricular oficial
);

CREATE TABLE t.calendario_escolar (
    id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    anio_escolar_id UUID    NOT NULL REFERENCES t.anio_escolar_config(id),
    fecha           DATE    NOT NULL,
    tipo_dia        t.tipo_dia NOT NULL DEFAULT 'LECTIVO',
    descripcion     VARCHAR(200),
    -- ej: 'Día del Maestro', 'Olimpiadas escolares', 'Suspensión por lluvia'
    creado_por      UUID    REFERENCES public.usuarios(id),

    UNIQUE (anio_escolar_id, fecha)
);

CREATE INDEX idx_calendario_anio_tipo ON t.calendario_escolar(anio_escolar_id, tipo_dia);
CREATE INDEX idx_calendario_fecha ON t.calendario_escolar(fecha);
```

---

## 4. Schema TENANT — Estructura académica

### 4.1 grados

```sql
CREATE TABLE t.grados (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    nivel           public.nivel_educativo NOT NULL,
    numero          SMALLINT NOT NULL,
    -- 1 al 6 para primaria, 1 al 5 para secundaria
    nombre          VARCHAR(30) NOT NULL,
    -- ej: 'Primer Grado', '1°'
    orden           SMALLINT NOT NULL,

    UNIQUE (nivel, numero)
);
-- Datos semilla: 11 registros (6 primaria + 5 secundaria)
```

### 4.2 secciones

```sql
CREATE TABLE t.secciones (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    anio_escolar_id UUID     NOT NULL REFERENCES t.anio_escolar_config(id),
    grado_id        UUID     NOT NULL REFERENCES t.grados(id),
    nombre          VARCHAR(20) NOT NULL,
    -- ej: 'A', 'B', 'Amarillo', 'Los Delfines'
    turno           VARCHAR(10) NOT NULL DEFAULT 'MAÑANA',
    -- MAÑANA | TARDE | NOCHE
    aforo_maximo    SMALLINT,
    activa          BOOLEAN  NOT NULL DEFAULT TRUE,

    UNIQUE (anio_escolar_id, grado_id, nombre)
);

CREATE INDEX idx_secciones_anio ON t.secciones(anio_escolar_id);
CREATE INDEX idx_secciones_grado ON t.secciones(grado_id);
```

### 4.3 areas_ie

```sql
CREATE TABLE t.areas_ie (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    anio_escolar_id UUID     NOT NULL REFERENCES t.anio_escolar_config(id),
    area_cneb_id    UUID     REFERENCES public.areas_cneb(id),
    -- NULL si es área de libre disponibilidad (no pertenece al CNEB)

    nombre_display  VARCHAR(100) NOT NULL,
    -- Nombre que el colegio usa internamente (puede diferir del CNEB)
    codigo_display  VARCHAR(20),
    nivel           public.nivel_educativo NOT NULL,
    es_area_cneb    BOOLEAN  NOT NULL DEFAULT TRUE,
    -- FALSE para áreas de libre disponibilidad
    -- Áreas con es_area_cneb=FALSE no cuentan para promoción (Doc 2)

    orden           SMALLINT NOT NULL,
    permite_exoneracion BOOLEAN NOT NULL DEFAULT FALSE,
    es_calificable  BOOLEAN  NOT NULL DEFAULT TRUE,
    peso_area       DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    -- Para promedio ponderado de áreas (si el colegio lo usa)
    activa          BOOLEAN  NOT NULL DEFAULT TRUE,

    UNIQUE (anio_escolar_id, nombre_display, nivel)
);

CREATE INDEX idx_areas_ie_anio_nivel ON t.areas_ie(anio_escolar_id, nivel);
```

### 4.4 competencias_ie

```sql
CREATE TABLE t.competencias_ie (
    id                  UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    area_ie_id          UUID     NOT NULL REFERENCES t.areas_ie(id),
    competencia_cneb_id UUID     REFERENCES public.competencias_cneb(id),
    -- NULL si es competencia de área de libre disponibilidad

    nombre_display      TEXT     NOT NULL,
    orden               SMALLINT NOT NULL,
    -- Orden en el Excel del SIAGIE — CRÍTICO que coincida con el orden oficial
    peso_competencia    DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    -- Para promedio ponderado dentro del área
    aplica_grados       SMALLINT[]  NOT NULL DEFAULT '{1,2,3,4,5,6}',
    activa              BOOLEAN  NOT NULL DEFAULT TRUE,

    UNIQUE (area_ie_id, orden)
);

CREATE INDEX idx_comp_ie_area ON t.competencias_ie(area_ie_id);
```

---

## 5. Schema TENANT — Docentes

### 5.1 docentes

```sql
CREATE TABLE t.docentes (
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
```

### 5.2 docente_area_seccion

```sql
-- Qué docente dicta qué área en qué sección y año
CREATE TABLE t.docente_area_seccion (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    anio_escolar_id UUID     NOT NULL REFERENCES t.anio_escolar_config(id),
    docente_id      UUID     NOT NULL REFERENCES t.docentes(id),
    area_ie_id      UUID     NOT NULL REFERENCES t.areas_ie(id),
    seccion_id      UUID     NOT NULL REFERENCES t.secciones(id),
    es_tutor        BOOLEAN  NOT NULL DEFAULT FALSE,
    -- Si el docente es también tutor de esta sección

    UNIQUE (anio_escolar_id, area_ie_id, seccion_id)
    -- Una sola área por docente por sección por año
);

CREATE INDEX idx_das_docente ON t.docente_area_seccion(docente_id);
CREATE INDEX idx_das_seccion ON t.docente_area_seccion(seccion_id);
CREATE INDEX idx_das_area ON t.docente_area_seccion(area_ie_id);
```

---

## 6. Schema TENANT — Estudiantes y matrícula

### 6.1 estudiantes

```sql
CREATE TABLE t.estudiantes (
    id                  UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Datos de identidad (sincronizados con RENIEC)
    dni                 VARCHAR(8) UNIQUE,
    -- NULL para estudiantes sin DNI (extranjeros, sin documento)
    tipo_documento      VARCHAR(20) NOT NULL DEFAULT 'DNI',
    -- DNI | CE | PASAPORTE | SIN_DOCUMENTO
    numero_documento    VARCHAR(20) NOT NULL,
    -- Igual al DNI si tiene, o el número del documento alternativo
    codigo_siagie       VARCHAR(14) UNIQUE,
    -- '000000' + DNI para estudiantes con DNI
    -- Generado por SIAGIE para estudiantes sin DNI (el director lo ingresa)

    apellido_paterno    VARCHAR(100) NOT NULL,
    apellido_materno    VARCHAR(100),
    nombres             VARCHAR(200) NOT NULL,
    fecha_nacimiento    DATE         NOT NULL,
    genero              CHAR(1)      NOT NULL,
    -- 'M' | 'F'
    ubigeo_nacimiento   VARCHAR(6)   REFERENCES public.ubigeos(codigo),

    -- Datos complementarios (opcionales, según el colegio)
    lengua_materna      VARCHAR(50)  DEFAULT 'CASTELLANO',
    etnia               VARCHAR(50),
    -- QUECHUA | AIMARA | INDIGENA_AMAZONICO | AFRODESCENDIENTE | OTRO
    tiene_discapacidad  BOOLEAN      DEFAULT FALSE,
    tipo_discapacidad   VARCHAR(100),

    -- Foto
    foto_url            VARCHAR(500),

    -- Datos validados en RENIEC (para trazabilidad)
    reniec_validado     BOOLEAN      NOT NULL DEFAULT FALSE,
    reniec_validado_en  TIMESTAMPTZ,

    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_estudiantes_dni ON t.estudiantes(dni) WHERE deleted_at IS NULL;
CREATE INDEX idx_estudiantes_nombres ON t.estudiantes(apellido_paterno, apellido_materno);
CREATE INDEX idx_estudiantes_codigo_siagie ON t.estudiantes(codigo_siagie);
```

### 6.2 apoderados

```sql
CREATE TABLE t.apoderados (
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
    -- Si el apoderado tiene acceso al portal
    activo          BOOLEAN  NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_apoderados_dni ON t.apoderados(dni);
```

### 6.3 estudiante_apoderado

```sql
CREATE TYPE t.parentesco AS ENUM (
    'PADRE', 'MADRE', 'ABUELO', 'ABUELA',
    'HERMANO', 'HERMANA', 'TIO', 'TIA',
    'APODERADO_LEGAL', 'OTRO'
);

CREATE TABLE t.estudiante_apoderado (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id   UUID     NOT NULL REFERENCES t.estudiantes(id),
    apoderado_id    UUID     NOT NULL REFERENCES t.apoderados(id),
    parentesco      t.parentesco NOT NULL,
    es_apoderado_principal BOOLEAN NOT NULL DEFAULT FALSE,
    -- El apoderado principal recibe las notificaciones
    vive_con_estudiante    BOOLEAN NOT NULL DEFAULT TRUE,

    UNIQUE (estudiante_id, apoderado_id)
);

CREATE INDEX idx_ea_estudiante ON t.estudiante_apoderado(estudiante_id);
CREATE INDEX idx_ea_apoderado ON t.estudiante_apoderado(apoderado_id);
```

### 6.4 matriculas

```sql
CREATE TYPE t.tipo_matricula AS ENUM (
    'CONTINUIDAD',
    'INGRESO',          -- Primera vez en el sistema educativo
    'REINCORPORACION',  -- Regresa después de 2+ años fuera
    'TRASLADO'          -- Viene de otra IE
);

CREATE TYPE t.condicion_matricula AS ENUM (
    'PROMOVIDO',
    'REPITE',
    'INGRESANTE'
);

CREATE TYPE t.estado_matricula AS ENUM (
    'ACTIVA',
    'RETIRADA',         -- El estudiante se retiró durante el año
    'TRASLADADA'        -- El estudiante se trasladó a otra IE
);

CREATE TABLE t.matriculas (
    id                  UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    anio_escolar_id     UUID     NOT NULL REFERENCES t.anio_escolar_config(id),
    estudiante_id       UUID     NOT NULL REFERENCES t.estudiantes(id),
    seccion_id          UUID     NOT NULL REFERENCES t.secciones(id),

    tipo_matricula      t.tipo_matricula      NOT NULL DEFAULT 'CONTINUIDAD',
    condicion_matricula t.condicion_matricula NOT NULL DEFAULT 'PROMOVIDO',
    estado              t.estado_matricula    NOT NULL DEFAULT 'ACTIVA',

    fecha_matricula     DATE     NOT NULL,
    fecha_inicio        DATE     NOT NULL,
    -- Puede diferir de fecha_matricula si el estudiante llegó tarde
    fecha_retiro        DATE,
    motivo_retiro       VARCHAR(200),

    -- Procedencia (para traslados y reingresos)
    ie_procedencia      VARCHAR(200),
    -- Nombre de la IE de procedencia
    codigo_modular_procedencia VARCHAR(7),

    -- Resolución directoral de nómina (para el documento oficial)
    rd_nomina_numero    VARCHAR(50),
    rd_nomina_fecha     DATE,

    -- Número de repeticiones en el nivel (para alertas de doble repetición)
    repeticiones_en_nivel SMALLINT NOT NULL DEFAULT 0,

    -- Resultado del cierre anual (lo llena PromocionService)
    resultado_final     VARCHAR(20),
    -- PROMOVIDO | PERMANECE | RECUPERACION | RETIRADO

    registrado_por      UUID     REFERENCES public.usuarios(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (anio_escolar_id, estudiante_id)
    -- Un estudiante solo puede tener una matrícula por año en esta IE
);

CREATE INDEX idx_matriculas_anio ON t.matriculas(anio_escolar_id);
CREATE INDEX idx_matriculas_estudiante ON t.matriculas(estudiante_id);
CREATE INDEX idx_matriculas_seccion ON t.matriculas(seccion_id);
CREATE INDEX idx_matriculas_estado ON t.matriculas(estado);
```

### 6.5 exoneraciones

```sql
CREATE TABLE t.exoneraciones (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula_id    UUID     NOT NULL REFERENCES t.matriculas(id),
    area_ie_id      UUID     NOT NULL REFERENCES t.areas_ie(id),
    -- Solo Educación Física y Educación Religiosa permiten exoneración

    tipo            VARCHAR(20) NOT NULL,
    -- TOTAL | PARCIAL (para Ed. Física según el impedimento)
    motivo          VARCHAR(200) NOT NULL,
    documento_url   VARCHAR(500),
    -- Certificado médico, carta del padre, etc.
    fecha_solicitud DATE     NOT NULL,
    aprobada        BOOLEAN  NOT NULL DEFAULT FALSE,
    aprobada_por    UUID     REFERENCES public.usuarios(id),

    UNIQUE (matricula_id, area_ie_id)
);
```

---

## 7. Schema TENANT — Evaluación y calificaciones

### 7.1 notas_periodo

```sql
CREATE TYPE t.calificativo_literal AS ENUM ('AD', 'A', 'B', 'C', 'EXO', 'NR');
-- EXO = Exonerado | NR = No Registrado (pendiente)

CREATE TABLE t.notas_periodo (
    id                  UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula_id        UUID     NOT NULL REFERENCES t.matriculas(id),
    competencia_ie_id   UUID     NOT NULL REFERENCES t.competencias_ie(id),
    periodo_id          UUID     NOT NULL REFERENCES t.periodos(id),

    -- Calificativo según el nivel
    calificativo_literal  t.calificativo_literal,
    -- Para primaria: AD / A / B / C / EXO
    -- Para secundaria: NULL (se usa calificativo_numerico)
    calificativo_numerico SMALLINT,
    -- Para secundaria: 0 al 20
    -- Para primaria: NULL (se usa calificativo_literal)

    -- Conclusión descriptiva (obligatoria por normativa)
    conclusion_descriptiva TEXT,

    -- Metadatos de registro
    registrado_por      UUID     NOT NULL REFERENCES public.usuarios(id),
    registrado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ultima_modificacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por      UUID     REFERENCES public.usuarios(id),

    UNIQUE (matricula_id, competencia_ie_id, periodo_id)
);

CREATE INDEX idx_notas_matricula ON t.notas_periodo(matricula_id);
CREATE INDEX idx_notas_competencia ON t.notas_periodo(competencia_ie_id);
CREATE INDEX idx_notas_periodo ON t.notas_periodo(periodo_id);
-- Índice compuesto para la query más frecuente (notas de una sección en un periodo)
CREATE INDEX idx_notas_periodo_comp ON t.notas_periodo(periodo_id, competencia_ie_id);
```

### 7.2 cierre_periodo

```sql
-- Control de apertura/cierre de periodos por sección
CREATE TABLE t.cierre_periodo (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    periodo_id      UUID     NOT NULL REFERENCES t.periodos(id),
    seccion_id      UUID     NOT NULL REFERENCES t.secciones(id),

    estado          t.estado_periodo NOT NULL DEFAULT 'ACTIVO',
    -- Permite cerrar periodos sección por sección

    notas_completas BOOLEAN  NOT NULL DEFAULT FALSE,
    -- Calculado: TRUE cuando todos los estudiantes tienen nota en todas las competencias
    porcentaje_notas_completas SMALLINT NOT NULL DEFAULT 0,

    cerrado_por     UUID     REFERENCES public.usuarios(id),
    cerrado_en      TIMESTAMPTZ,

    UNIQUE (periodo_id, seccion_id)
);
```

### 7.3 cierre_anio

```sql
CREATE TYPE t.resultado_anio AS ENUM (
    'PROMOVIDO',
    'PERMANECE',        -- Repite el grado
    'RECUPERACION',     -- Va al programa de recuperación
    'RETIRADO',
    'POSTERGADO'        -- Caso especial con intervención UGEL
);

CREATE TABLE t.cierre_anio (
    id                  UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula_id        UUID     NOT NULL REFERENCES t.matriculas(id) UNIQUE,

    resultado           t.resultado_anio,
    -- Calculado por PromocionService al ejecutar el cierre

    -- Promedios anuales por área (JSON para flexibilidad)
    promedios_areas     JSONB,
    -- Ejemplo:
    -- {
    --   "comunicacion": {"literal": "A", "numerico": null},
    --   "matematica":   {"literal": "B", "numerico": null}
    -- }

    -- Para estudiantes en recuperación: áreas pendientes
    areas_recuperacion  JSONB,
    -- Ejemplo: ["matematica", "comunicacion"]

    -- Resultado post-recuperación
    resultado_recuperacion t.resultado_anio,
    notas_recuperacion  JSONB,

    -- Control del proceso
    calculado_en        TIMESTAMPTZ,
    calculado_por       UUID     REFERENCES public.usuarios(id),
    revisado_director   BOOLEAN  NOT NULL DEFAULT FALSE,
    revisado_en         TIMESTAMPTZ,

    -- Para casos especiales que el director corrige manualmente
    es_caso_especial    BOOLEAN  NOT NULL DEFAULT FALSE,
    justificacion_caso  TEXT,
    -- Obligatorio si es_caso_especial = TRUE

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cierre_anio_resultado ON t.cierre_anio(resultado);
```

### 7.4 recuperacion_matricula

```sql
CREATE TABLE t.recuperacion_matricula (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula_id    UUID     NOT NULL REFERENCES t.matriculas(id),
    area_ie_id      UUID     NOT NULL REFERENCES t.areas_ie(id),

    -- Notas de recuperación por competencia (JSONB para flexibilidad)
    notas_recuperacion JSONB,
    -- {
    --   "{competencia_ie_id}": {"literal": "A", "numerico": null}
    -- }

    resultado_area  VARCHAR(10),
    -- APROBADO | DESAPROBADO (post-recuperación)

    docente_id      UUID     REFERENCES t.docentes(id),
    fecha_evaluacion DATE,

    UNIQUE (matricula_id, area_ie_id)
);
```

---

## 8. Schema TENANT — Asistencia

### 8.1 asistencia_diaria

```sql
CREATE TYPE t.estado_asistencia AS ENUM (
    'P',    -- Presente
    'T',    -- Tardanza
    'FI',   -- Falta injustificada
    'FJ',   -- Falta justificada
    'PS',   -- Permiso con salida anticipada
    'LM',   -- Licencia médica
    'NM'    -- No matriculado (días antes de la fecha de matrícula)
);

CREATE TYPE t.modalidad_clase AS ENUM ('PRESENCIAL', 'VIRTUAL', 'SEMIPRESENCIAL');

CREATE TABLE t.asistencia_diaria (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula_id    UUID     NOT NULL REFERENCES t.matriculas(id),
    fecha           DATE     NOT NULL,

    estado          t.estado_asistencia NOT NULL DEFAULT 'P',
    modalidad       t.modalidad_clase   NOT NULL DEFAULT 'PRESENCIAL',
    hora_llegada    TIME,
    -- Solo relevante cuando estado = 'T' (tardanza)

    registrado_por  UUID     NOT NULL REFERENCES public.usuarios(id),
    registrado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Justificación pendiente (si llegó tarde la justificación)
    pendiente_justificacion BOOLEAN NOT NULL DEFAULT FALSE,
    plazo_justificacion     DATE,
    -- Fecha límite para presentar justificación (calculada al crear el registro)

    observacion     TEXT,

    UNIQUE (matricula_id, fecha)
);

CREATE INDEX idx_asistencia_matricula ON t.asistencia_diaria(matricula_id);
CREATE INDEX idx_asistencia_fecha ON t.asistencia_diaria(fecha);
CREATE INDEX idx_asistencia_estado ON t.asistencia_diaria(estado);
-- Índice para la query de asistencia de una sección en un día
CREATE INDEX idx_asistencia_fecha_estado ON t.asistencia_diaria(fecha, estado);
```

### 8.2 justificaciones

```sql
CREATE TYPE t.estado_justificacion AS ENUM (
    'PENDIENTE',
    'APROBADA',
    'RECHAZADA'
);

CREATE TYPE t.motivo_justificacion AS ENUM (
    'ENF',  -- Enfermedad
    'FAM',  -- Emergencia familiar
    'MED',  -- Cita médica
    'ACT',  -- Actividad oficial
    'DUE',  -- Duelo
    'VIA',  -- Viaje
    'OTR'   -- Otro
);

CREATE TABLE t.justificaciones (
    id                  UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    asistencia_id       UUID     NOT NULL REFERENCES t.asistencia_diaria(id),
    motivo              t.motivo_justificacion NOT NULL,
    descripcion         TEXT,
    documento_url       VARCHAR(500),
    -- URL del certificado médico, declaración jurada, etc. en S3/R2

    fecha_presentacion  DATE     NOT NULL DEFAULT CURRENT_DATE,
    estado              t.estado_justificacion NOT NULL DEFAULT 'PENDIENTE',

    revisado_por        UUID     REFERENCES public.usuarios(id),
    revisado_en         TIMESTAMPTZ,
    observacion_revision TEXT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_justif_asistencia ON t.justificaciones(asistencia_id);
CREATE INDEX idx_justif_estado ON t.justificaciones(estado);
```

### 8.3 alertas_asistencia

```sql
CREATE TYPE t.nivel_alerta AS ENUM ('AMARILLO', 'NARANJA', 'ROJO');

CREATE TYPE t.tipo_alerta AS ENUM (
    'ACUMULADO',         -- Supera el umbral de % de inasistencias
    'AUSENCIA_CONTINUA', -- N días seguidos sin justificación
    'PATRON_SEMANAL',    -- Faltas recurrentes el mismo día
    'INICIO_PERIODO',    -- Faltas en los primeros días del año/periodo
    'ACUMULADO_MENSUAL'  -- Supera N faltas en el mes
);

CREATE TABLE t.alertas_asistencia (
    id                      UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula_id            UUID     NOT NULL REFERENCES t.matriculas(id),
    tipo                    t.tipo_alerta NOT NULL,
    nivel                   t.nivel_alerta NOT NULL,

    porcentaje_calculado    DECIMAL(5,2),
    -- Solo para tipo ACUMULADO
    dias_continuos          SMALLINT,
    -- Solo para tipo AUSENCIA_CONTINUA

    generada_en             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notificado_apoderado    BOOLEAN  NOT NULL DEFAULT FALSE,
    notificado_director     BOOLEAN  NOT NULL DEFAULT FALSE,
    atendida                BOOLEAN  NOT NULL DEFAULT FALSE,
    atendida_en             TIMESTAMPTZ,
    atendida_por            UUID     REFERENCES public.usuarios(id),
    observacion             TEXT
);

CREATE INDEX idx_alertas_matricula ON t.alertas_asistencia(matricula_id);
CREATE INDEX idx_alertas_atendida ON t.alertas_asistencia(atendida);
CREATE INDEX idx_alertas_nivel ON t.alertas_asistencia(nivel, atendida);
```

---

## 9. Schema TENANT — Sincronización y comunicaciones

### 9.1 siagie_sync_log

```sql
CREATE TYPE t.modulo_siagie AS ENUM (
    'MATRICULA',
    'ASISTENCIA',
    'CALIFICACIONES',
    'NOTAS_FINALES'
);

CREATE TYPE t.estado_sync AS ENUM (
    'PENDIENTE',
    'EXPORTADO',        -- Excel generado y descargado por el director
    'CARGADO_OK',       -- Director confirmó que el SIAGIE lo aceptó
    'CARGADO_CON_ERRORES' -- El SIAGIE rechazó algunos registros
);

CREATE TABLE t.siagie_sync_log (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    modulo          t.modulo_siagie NOT NULL,
    anio_escolar    SMALLINT NOT NULL,
    nivel           public.nivel_educativo,
    grado_numero    SMALLINT,
    seccion_nombre  VARCHAR(20),
    periodo_codigo  VARCHAR(10),
    mes             SMALLINT,
    -- Para módulo ASISTENCIA: mes del año (1-12)

    estado          t.estado_sync NOT NULL DEFAULT 'PENDIENTE',

    exportado_en    TIMESTAMPTZ,
    exportado_por   UUID     REFERENCES public.usuarios(id),
    archivo_nombre  VARCHAR(200),
    -- Nombre del archivo Excel generado

    cargado_en      TIMESTAMPTZ,
    cargado_por     UUID     REFERENCES public.usuarios(id),
    observacion     TEXT,
    -- Descripción de errores si estado = CARGADO_CON_ERRORES

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sync_modulo ON t.siagie_sync_log(modulo, anio_escolar);
CREATE INDEX idx_sync_estado ON t.siagie_sync_log(estado);
```

### 9.2 informe_progreso_entrega

```sql
CREATE TABLE t.informe_progreso_entrega (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula_id    UUID     NOT NULL REFERENCES t.matriculas(id),
    periodo_id      UUID     NOT NULL REFERENCES t.periodos(id),

    generado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    generado_por    UUID     NOT NULL REFERENCES public.usuarios(id),
    pdf_url         VARCHAR(500),
    -- URL del PDF generado en S3/R2

    -- Canales de distribución
    enviado_portal  BOOLEAN  NOT NULL DEFAULT FALSE,
    enviado_email   BOOLEAN  NOT NULL DEFAULT FALSE,
    enviado_wa      BOOLEAN  NOT NULL DEFAULT FALSE,

    -- Confirmación de recepción
    leido_apoderado BOOLEAN  NOT NULL DEFAULT FALSE,
    leido_en        TIMESTAMPTZ,

    UNIQUE (matricula_id, periodo_id)
);

CREATE INDEX idx_ipentrega_matricula ON t.informe_progreso_entrega(matricula_id);
CREATE INDEX idx_ipentrega_periodo ON t.informe_progreso_entrega(periodo_id);
```

### 9.3 notificaciones

```sql
CREATE TYPE t.canal_notificacion AS ENUM (
    'PUSH', 'WHATSAPP', 'EMAIL', 'SMS', 'INTERNO'
);

CREATE TYPE t.estado_envio AS ENUM (
    'ENVIADO', 'FALLIDO', 'LEIDO', 'PENDIENTE'
);

CREATE TABLE t.notificaciones (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Destinatario
    apoderado_id    UUID     REFERENCES t.apoderados(id),
    usuario_id      UUID     REFERENCES public.usuarios(id),
    -- Al menos uno de los dos debe estar presente

    -- Contexto (qué originó la notificación)
    matricula_id    UUID     REFERENCES t.matriculas(id),
    alerta_id       UUID     REFERENCES t.alertas_asistencia(id),
    -- NULL si la notificación no está relacionada con una alerta

    canal           t.canal_notificacion NOT NULL,
    plantilla       VARCHAR(50) NOT NULL,
    -- ej: 'INASISTENCIA_DIARIA', 'ALERTA_ACUMULADO', 'LIBRETA_DISPONIBLE'
    contenido       TEXT     NOT NULL,

    enviado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estado          t.estado_envio NOT NULL DEFAULT 'PENDIENTE',
    error_detalle   TEXT
    -- Descripción del error si estado = FALLIDO
);

CREATE INDEX idx_notif_apoderado ON t.notificaciones(apoderado_id);
CREATE INDEX idx_notif_matricula ON t.notificaciones(matricula_id);
CREATE INDEX idx_notif_estado ON t.notificaciones(estado);
```

---

## 10. Configuración de Prisma para multitenant

### 10.1 schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
  // Habilitar preview de múltiples schemas
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["public"]
  // Los schemas de tenant se gestionan dinámicamente
}

// --- MODELOS DEL SCHEMA PUBLIC ---

model Tenant {
  id          String   @id @default(uuid())
  slug        String   @unique
  nombre      String
  schemaName  String   @unique @map("schema_name")
  activo      Boolean  @default(true)
  plan        String   @default("basico")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  datosMinedu TenantDatosMinedu?
  pdfConfig   TenantPdfConfig?
  usuarios    Usuario[]

  @@map("tenants")
  @@schema("public")
}

model AreaCneb {
  id                  String   @id @default(uuid())
  codigo              String   @unique
  nombre              String
  nivel               NivelEducativo
  orden               Int
  permiteExoneracion  Boolean  @default(false) @map("permite_exoneracion")
  esCalificable       Boolean  @default(true)  @map("es_calificable")
  activo              Boolean  @default(true)

  competencias CompetenciaCneb[]

  @@map("areas_cneb")
  @@schema("public")
}
// ... resto de modelos del schema public
```

### 10.2 Servicio de conexión por tenant (NestJS)

```typescript
// src/database/tenant-prisma.service.ts

import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class TenantPrismaService implements OnModuleDestroy {
  private clients = new Map<string, PrismaClient>();

  async getClient(schemaName: string): Promise<PrismaClient> {
    if (this.clients.has(schemaName)) {
      return this.clients.get(schemaName)!;
    }

    const client = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_URL },
      },
    });

    // Configurar el search_path al schema del tenant
    await client.$executeRawUnsafe(
      `SET search_path TO "${schemaName}", public`
    );

    this.clients.set(schemaName, client);
    return client;
  }

  async onModuleDestroy() {
    for (const client of this.clients.values()) {
      await client.$disconnect();
    }
  }
}
```

### 10.3 Middleware de tenant (NestJS)

```typescript
// src/common/middleware/tenant.middleware.ts

import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { TenantPrismaService } from '../database/tenant-prisma.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly publicPrisma: PrismaClient,
    private readonly tenantPrisma: TenantPrismaService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Extraer el tenant del subdominio o del JWT
    const slug = this.extractTenantSlug(req);

    const tenant = await this.publicPrisma.tenant.findUnique({
      where: { slug, activo: true },
    });

    if (!tenant) {
      throw new NotFoundException('Institución educativa no encontrada');
    }

    // Inyectar el PrismaClient del tenant en el request
    req['tenant'] = tenant;
    req['tenantDb'] = await this.tenantPrisma.getClient(tenant.schemaName);

    next();
  }

  private extractTenantSlug(req: Request): string {
    // Opción 1: desde subdominio (colegio_abc.sistema.com)
    const host = req.hostname;
    const subdomain = host.split('.')[0];
    if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
      return subdomain;
    }
    // Opción 2: desde header personalizado
    return req.headers['x-tenant-slug'] as string;
  }
}
```

### 10.4 Migraciones por tenant

```typescript
// src/scripts/migrate-tenant.ts
// Ejecutar al crear un nuevo colegio o al actualizar el schema

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

async function migrateTenant(schemaName: string) {
  const prisma = new PrismaClient();

  // 1. Crear el schema si no existe
  await prisma.$executeRawUnsafe(
    `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`
  );

  // 2. Aplicar las migraciones al schema del tenant
  process.env.DATABASE_URL = process.env.DATABASE_URL +
    `?search_path="${schemaName}"`;

  execSync('npx prisma migrate deploy', { stdio: 'inherit' });

  // 3. Cargar datos semilla del tenant (grados, periodos base)
  await seedTenantData(schemaName, prisma);

  await prisma.$disconnect();
}
```

---

## 11. Queries clave del sistema

### 11.1 Notas de una sección en un periodo (query más frecuente)

```typescript
// Obtener todas las notas de una sección para el docente
const notas = await tenantDb.notas_periodo.findMany({
  where: {
    periodo_id: periodoId,
    matricula: {
      seccion_id: seccionId,
      estado: 'ACTIVA',
    },
  },
  include: {
    matricula: {
      include: { estudiante: true },
    },
    competencia_ie: {
      include: { area_ie: true },
    },
  },
  orderBy: [
    { matricula: { estudiante: { apellido_paterno: 'asc' } } },
    { competencia_ie: { orden: 'asc' } },
  ],
});
```

### 11.2 Porcentaje de asistencia de un estudiante (en tiempo real)

```typescript
// Calcular % de inasistencias hasta la fecha actual
const [diasLectivos, diasFalta] = await Promise.all([
  tenantDb.calendario_escolar.count({
    where: {
      anio_escolar_id: anioId,
      tipo_dia: 'LECTIVO',
      fecha: { lte: new Date() },
    },
  }),
  tenantDb.asistencia_diaria.count({
    where: {
      matricula_id: matriculaId,
      estado: 'FI',
    },
  }),
]);

const porcentajeFalta = diasLectivos > 0
  ? (diasFalta / diasLectivos) * 100
  : 0;
```

### 11.3 Motor de promoción — calcular resultado de un estudiante

```typescript
// PromocionService.calcularResultado(matriculaId)
async calcularResultado(matriculaId: string) {
  const grado = /* obtener grado del estudiante */;
  const notas = /* obtener promedios anuales por área */;

  // Áreas CNEB solamente (excluir libre disponibilidad)
  const areasCneb = notas.filter(n => n.area.es_area_cneb);

  // Contar áreas con C en más de la mitad de competencias
  const areasConC = areasCneb.filter(area => {
    const compConC = area.competencias.filter(
      c => c.calificativo_literal === 'C' && !c.exonerada
    ).length;
    const totalComp = area.competencias.filter(
      c => !c.exonerada
    ).length;
    return compConC >= totalComp / 2;
  }).length;

  // Aplicar reglas según grado (Doc 2, sección 6)
  if (areasConC >= 4) return 'PERMANECE';
  if (areasConC >= 1) return 'RECUPERACION';
  return 'PROMOVIDO';
}
```

---

## 12. Índices adicionales recomendados

```sql
-- Para el dashboard de alertas del director (query más pesada)
CREATE INDEX idx_asistencia_fi_anio ON t.asistencia_diaria(estado)
  WHERE estado = 'FI';

-- Para el reporte de asistencia mensual (exportación SIAGIE)
CREATE INDEX idx_asistencia_mes ON t.asistencia_diaria(
  (EXTRACT(MONTH FROM fecha)),
  (EXTRACT(YEAR FROM fecha))
);

-- Para búsqueda rápida de estudiantes por nombre
CREATE INDEX idx_estudiantes_fullname ON t.estudiantes
  USING gin(to_tsvector('spanish',
    apellido_paterno || ' ' || COALESCE(apellido_materno,'') || ' ' || nombres
  ));

-- Para el cierre de año (procesar sección por sección)
CREATE INDEX idx_notas_matricula_periodo ON t.notas_periodo(
  matricula_id, periodo_id
);
```

---

## 13. Resumen del modelo en números

| Elemento | Cantidad |
|---|---|
| Schemas compartidos (public) | 1 |
| Tablas en schema public | 8 |
| Tablas por schema de tenant | 22 |
| Total de tablas (1 tenant) | 30 |
| Enums definidos | 18 |
| Índices recomendados | ~35 |
| Competencias CNEB semilla (primaria + secundaria) | ~29 |
| Grados semilla | 11 |

---

## 14. Checklist de implementación

```
Schema público:
  ☐ Crear tablas public (tenants, usuarios, areas_cneb, competencias_cneb, ubigeos)
  ☐ Cargar datos semilla: áreas CNEB, competencias, ubigeos INEI, grados
  ☐ Cargar feriados nacionales del año en curso

Por cada tenant nuevo:
  ☐ Crear schema PostgreSQL con el slug del colegio
  ☐ Aplicar migraciones al nuevo schema
  ☐ Cargar datos semilla del tenant (grados, áreas IE desde CNEB, configuración base)
  ☐ Crear usuario director con rol DIRECTOR
  ☐ Registrar tenant_datos_minedu (código modular, director)
  ☐ Configurar anio_escolar_config y regimen_config
  ☐ Poblar calendario_escolar con días lectivos y feriados del año

Al inicio de cada año escolar:
  ☐ Crear nuevo anio_escolar_config
  ☐ Crear secciones por grado y nivel
  ☐ Asignar docentes a áreas y secciones
  ☐ Crear periodos según el régimen configurado
  ☐ Poblar calendario_escolar del nuevo año
  ☐ Iniciar proceso de matrícula
```

---

## 15. Cierre de la serie

Con este documento se completa la serie de 6 documentos de contexto técnico-legal. El conjunto cubre:

| Doc | Tema | Estado |
|---|---|---|
| 01 | Marco legal y normativo EBR | ✅ Completo |
| 02 | Estructura curricular y calificación | ✅ Completo |
| 03 | Gestión de asistencia | ✅ Completo |
| 04 | Integración con SIAGIE (manual v1) | ✅ Completo |
| 05 | Documentos oficiales MINEDU | ✅ Completo |
| 06 | Schema de base de datos | ✅ Completo |

**Siguiente paso recomendado:** Implementar el schema en PostgreSQL, cargar los datos semilla del CNEB, y arrancar con el módulo de matrícula que es el punto de entrada de todos los demás módulos.

---

*Documento generado como parte de la serie de contexto técnico-legal para el sistema multitenant de gestión escolar EBR Perú.*  
*El schema debe evolucionar con las migraciones de Prisma — nunca modificar tablas directamente en producción.*
