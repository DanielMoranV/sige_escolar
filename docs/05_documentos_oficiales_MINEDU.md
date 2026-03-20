# Documento 5 — Documentos Oficiales MINEDU
## Sistema de Gestión Escolar · Educación Básica Regular (EBR) · Perú

> **Serie:** Contexto Legal y Técnico para Sistema Multitenant de Gestión Escolar Peruana  
> **Documento:** 5 de 6  
> **Alcance:** EBR — Estructura, contenido y generación de los 5 documentos oficiales exigidos por el MINEDU  
> **Norma base:** R.M. N° 432-2020-MINEDU · R.V.M. N° 094-2020-MINEDU · R.M. N° 452-2025-MINEDU  
> **Última revisión:** Marzo 2026  

---

## 1. Mapa de documentos oficiales

El sistema debe generar dos categorías de documentos:

| Categoría | Quién lo genera | Validez legal | Cuándo |
|---|---|---|---|
| **Documentos oficiales** (emitidos por SIAGIE) | El SIAGIE los genera con los datos que cargó la IE | Plena validez ante cualquier entidad del Estado | Nóminas, actas, certificados |
| **Documentos de uso interno** (generados por nuestro sistema) | Nuestro sistema en PDF | Uso interno de la IE y comunicación con familias | Libretas, registros auxiliares, reportes |

> **Regla fundamental:** Nuestro sistema genera los documentos internos directamente en PDF. Los documentos oficiales los genera el SIAGIE — nuestro rol es proveer los datos correctos para que el SIAGIE los genere sin errores.

La única excepción es el **Informe de Progreso (libreta)**: nuestro sistema lo genera como documento interno; el SIAGIE también puede generarlo en modo oficial, pero la mayoría de colegios privados usa su propia versión diseñada.

### 1.1 Los 5 documentos del ciclo escolar

```
INICIO DE AÑO                                                    FIN DE AÑO
    │                                                                │
    ▼                                                                ▼
[1] Nómina            [3] Registro Auxiliar    [4] Acta         [5] Certificado
    de Matrícula      (uso interno, continuo)      Consolidada      de Estudios
                                                   de Evaluación    (a solicitud)
                      [2] Informe de Progreso
                          (Libreta de notas)
                          por periodo
```

---

## 2. Documento 1 — Nómina de Matrícula

### 2.1 Qué es y para qué sirve

La nómina de matrícula es el **registro oficial** de los estudiantes matriculados en cada sección al inicio del año escolar. Es el primer documento que se genera y el que da validez legal a la matrícula de cada estudiante.

- **Quién la emite:** El director de la IE a través del SIAGIE
- **Cuándo:** Dentro de los **45 días calendario** posteriores al inicio del año lectivo
- **Validez:** Documento oficial con firma y sello del director — acredita que el estudiante está formalmente matriculado
- **Rectificación:** Si hay errores, se solicita a la UGEL mediante el proceso de rectificación de nómina (requiere autorización de la UGEL)

### 2.2 Tipos de nómina

| Tipo | Cuándo se genera | Descripción |
|---|---|---|
| **Nómina de inicio** | Primeros 45 días del año | Estudiantes matriculados al inicio del año |
| **Nómina adicional** | Después de los 45 días | Estudiantes que se matricularon tarde o se trasladaron |
| **Nómina rectificada** | A solicitud del director + aprobación UGEL | Corrección de datos erróneos en nómina ya emitida |

### 2.3 Campos que contiene la nómina oficial (encabezado del documento)

```
MINISTERIO DE EDUCACIÓN
NÓMINA DE MATRÍCULA — AÑO ESCOLAR [XXXX]

Institución Educativa:    [Nombre oficial de la IE]
Código Modular:           [7 dígitos]
Anexo:                    [0]
DRE:                      [Nombre de la Dirección Regional de Educación]
UGEL:                     [Nombre de la UGEL]
Distrito / Provincia / Región: [Según UBIGEO]
Nivel:                    [PRIMARIA / SECUNDARIA]
Grado:                    [1° al 6° / 1° al 5°]
Sección:                  [Letra]
Turno:                    [MAÑANA / TARDE / NOCHE]
Tipo de gestión:          [PRIVADA / PÚBLICA / CONVENIO]
Resolución Directoral N°: [Número de RD que aprueba la nómina]
Fecha de aprobación:      [DD/MM/AAAA]
```

### 2.4 Campos por cada estudiante (cuerpo del documento)

| N° | Campo | Observaciones |
|---|---|---|
| 1 | N° de orden | Correlativo, ordenado alfabéticamente por apellidos |
| 2 | Código del estudiante | 14 dígitos (000000 + DNI) |
| 3 | DNI | 8 dígitos |
| 4 | Apellido paterno | |
| 5 | Apellido materno | |
| 6 | Nombres | |
| 7 | Fecha de nacimiento | DD/MM/AAAA |
| 8 | Género | M / F |
| 9 | Condición de matrícula | PROMOVIDO / REPITE / INGRESANTE / TRASLADO |
| 10 | IE de procedencia | Para traslados y reingresos |
| 11 | Fecha de matrícula | |
| 12 | Lengua materna | |
| 13 | Etnia | (opcional según normativa) |

**Pie del documento:**

```
Firma y sello del Director
Nombre completo del Director
DNI del Director
Fecha de emisión
```

### 2.5 Qué genera nuestro sistema vs. qué genera el SIAGIE

| Nuestro sistema genera | El SIAGIE genera |
|---|---|
| Excel de matrícula masiva con todos los campos (Doc 4, sección 3) | La nómina oficial en PDF con membrete MINEDU, numeración y validez legal |
| Listado interno de matriculados para uso del colegio | La nómina de inicio, adicional y rectificada |
| Reporte de "estudiantes sin código SIAGIE" (alerta antes de exportar) | El código del estudiante para los que se registran por primera vez |

### 2.6 Implicancias técnicas

- Nuestro sistema debe tener el campo `resolucion_directoral` en la configuración del año escolar por sección (`matriculas_config.rd_nomina` y `matriculas_config.fecha_aprobacion_nomina`)
- El listado interno de matriculados que genera nuestro sistema debe poder exportarse ordenado alfabéticamente y numerado correlativamente — la misma lógica que usa la nómina oficial
- La alerta "45 días" debe aparecer en el dashboard del director cuando falten pocos días para el vencimiento del plazo de nómina

---

## 3. Documento 2 — Informe de Progreso (Libreta de Notas)

### 3.1 Qué es y para qué sirve

El Informe de Progreso es el documento que comunica periódicamente a la familia los niveles de logro del estudiante por competencia. En la práctica se le llama "libreta de notas", aunque el MINEDU prefiere el término "informe de progreso" para enfatizar su carácter formativo.

- **Quién lo emite:** La IE (docente tutor y director)
- **Cuándo:** Al cierre de cada periodo (bimestre, trimestre o semestre)
- **Validez:** Documento informativo — no tiene el carácter de acta oficial, pero es exigible por las familias
- **Generación:** Nuestro sistema lo genera directamente en PDF con el diseño del colegio

### 3.2 Contenido mínimo exigido por la normativa

La normativa (R.V.M. 094-2020) establece que el informe de progreso debe comunicar:

```
Por cada área curricular y sus competencias:
  1. Calificativo (AD / A / B / C para primaria; 0-20 para secundaria)
  2. Conclusión descriptiva (texto cualitativo del docente)

Además:
  3. Asistencia del periodo (días asistidos, faltas justificadas, faltas injustificadas)
  4. Observaciones del tutor (apreciación general del estudiante)
  5. Firma del director y/o tutor
  6. Espacio para firma del apoderado (acuse de recibo)
```

### 3.3 Estructura del documento (layout recomendado)

```
┌─────────────────────────────────────────────────────────┐
│  LOGO IE          INSTITUCIÓN EDUCATIVA [NOMBRE]         │
│                   INFORME DE PROGRESO — [PERIODO]        │
│                   Año Escolar [XXXX]                     │
├─────────────────────────────────────────────────────────┤
│  Estudiante:  [Apellidos, Nombres]                       │
│  Grado:       [X°]  Sección: [A]  Nivel: [Primaria]     │
│  Tutor(a):    [Nombre del docente tutor]                 │
├──────────────────────┬──────────────────────────────────┤
│  ÁREA / COMPETENCIA  │  CALIFICATIVO  │  CONCLUSIÓN     │
├──────────────────────┼────────────────┼─────────────────┤
│  Comunicación        │                │                  │
│  · Comp. 1           │      A         │  [Texto...]     │
│  · Comp. 2           │      B         │  [Texto...]     │
│  · Comp. 3           │      A         │  [Texto...]     │
├──────────────────────┼────────────────┼─────────────────┤
│  Matemática          │                │                  │
│  · Comp. 1           │      AD        │  [Texto...]     │
│  ...                 │                │                  │
├──────────────────────┴──────────────────────────────────┤
│  ASISTENCIA DEL PERIODO                                  │
│  Días lectivos: [N]  Asistencias: [N]                    │
│  Faltas justificadas: [N]  Faltas injustificadas: [N]    │
├─────────────────────────────────────────────────────────┤
│  APRECIACIÓN DEL TUTOR:                                  │
│  [Texto libre del tutor sobre el estudiante]             │
├──────────────────────┬──────────────────────────────────┤
│  Firma Director      │  Firma Tutor   │  Firma Apoderado│
│  [_______________]   │  [___________] │  [_____________]│
│  Fecha: [DD/MM/AAAA] │               │                  │
└──────────────────────┴────────────────┴─────────────────┘
```

### 3.4 Variante de nuestro sistema vs. el SIAGIE

| Aspecto | Nuestro sistema | SIAGIE |
|---|---|---|
| Diseño / branding | Con logo, colores y nombre del colegio | Formato genérico MINEDU |
| Conclusiones descriptivas | Ingresadas por el docente en nuestro sistema | Ingresadas en el SIAGIE por el docente |
| Generación | PDF desde nuestro sistema, a demanda o masivo | PDF generado por el SIAGIE módulo evaluación |
| Distribución | Digital (portal padres / WhatsApp / email) | Impresión física desde el SIAGIE |

> **Recomendación de diseño:** Ofrecer una plantilla base configurable por tenant. El director puede subir su propio logo, definir colores institucionales y personalizar la disposición de secciones. Esto es un diferenciador comercial relevante.

### 3.5 Generación masiva vs. individual

El sistema debe soportar:

```
Generación individual:
  Director selecciona: estudiante → periodo
  Sistema genera 1 PDF con la libreta de ese estudiante

Generación masiva por sección:
  Director selecciona: grado → sección → periodo
  Sistema genera 1 PDF con todas las libretas de la sección
  (cada libreta en una página o par de páginas)

Generación masiva por nivel:
  Para entregar todas las libretas de primaria o secundaria en un lote
```

### 3.6 Control de entrega

El sistema debe registrar si la libreta fue entregada/leída por el apoderado:

```sql
CREATE TABLE informe_progreso_entrega (
    id              UUID PRIMARY KEY,
    tenant_id       UUID,
    matricula_id    UUID,           -- Estudiante × año
    periodo         VARCHAR(20),    -- BIM1, BIM2, TRIM1, SEM1, etc.
    generado_en     TIMESTAMP,
    generado_por    UUID,           -- FK usuario
    enviado_portal  BOOLEAN DEFAULT FALSE,
    enviado_email   BOOLEAN DEFAULT FALSE,
    enviado_wa      BOOLEAN DEFAULT FALSE,
    leido_apoderado BOOLEAN DEFAULT FALSE,
    leido_en        TIMESTAMP,
    firma_apoderado BOOLEAN DEFAULT FALSE  -- Si el colegio requiere firma digital
);
```

---

## 4. Documento 3 — Registro Auxiliar de Evaluación

### 4.1 Qué es y para qué sirve

El Registro Auxiliar es el **cuaderno de trabajo del docente** donde registra las notas de sus estudiantes durante el periodo, antes de ingresar el calificativo final al SIAGIE. Es de uso interno — no tiene validez oficial ante el MINEDU pero es exigible por el director al docente.

- **Quién lo lleva:** Cada docente de área
- **Cuándo:** Continuamente durante el periodo (actividades, evidencias, evaluaciones parciales)
- **Validez:** Uso interno / gestión pedagógica — lo exige el director durante supervisión

### 4.2 Contenido del registro auxiliar

```
Encabezado:
  IE | Año escolar | Nivel | Grado | Sección | Área | Docente | Periodo

Por cada competencia del área:
  - Lista de estudiantes (apellidos y nombres)
  - Columnas de evidencias/actividades evaluadas (fechas)
  - Columna de calificativo final del periodo

Pie:
  Firma del docente
```

### 4.3 Qué genera nuestro sistema

Nuestro sistema genera el Registro Auxiliar como:

1. **Formato PDF vacío** al inicio del periodo — el docente lo imprime y lo llena a mano (práctica común)
2. **Vista digital** dentro del sistema — el docente registra actividades y el sistema calcula el calificativo sugerido
3. **Export Excel** — para docentes que prefieren llevar el registro en hoja de cálculo

> El Registro Auxiliar no se exporta al SIAGIE — es puramente interno.

---

## 5. Documento 4 — Acta Consolidada de Evaluación

### 5.1 Qué es y para qué sirve

El Acta Consolidada de Evaluación es el **documento más importante del año escolar**. Certifica los resultados finales de cada estudiante y determina oficialmente si fue promovido, permanece en el grado, o va a recuperación.

- **Quién la emite:** El director a través del SIAGIE — es el único documento que no puede ser generado por sistemas externos con validez legal
- **Cuándo:** Al cierre del año escolar (diciembre) y al cierre del programa de recuperación (febrero)
- **Validez:** Documento oficial de máximo rango — rectificarla requiere un proceso formal con la UGEL
- **Fases:** Acta de fase regular (diciembre) + Acta de fase de recuperación (febrero, si aplica)

### 5.2 Tipos de acta

| Tipo | Cuándo | Descripción |
|---|---|---|
| **Acta de fase regular** | Diciembre | Resultados del año escolar regular |
| **Acta de fase de recuperación** | Febrero | Resultados del programa de recuperación pedagógica |
| **Acta de postergación** | Caso especial | Para estudiantes que postergan su evaluación por situación especial |
| **Acta rectificada** | A solicitud + UGEL | Corrección de errores, requiere autorización previa de la UGEL |

### 5.3 Encabezado del acta oficial

```
MINISTERIO DE EDUCACIÓN
ACTA CONSOLIDADA DE EVALUACIÓN
[FASE REGULAR / RECUPERACIÓN]
AÑO ESCOLAR [XXXX]

IE:              [Nombre oficial]
Código Modular:  [7 dígitos]
DRE:             [Nombre]
UGEL:            [Nombre]
Nivel:           [PRIMARIA / SECUNDARIA]
Grado:           [X°]   Sección: [A]
Turno:           [MAÑANA / TARDE]
Fecha de emisión: [DD/MM/AAAA]
```

### 5.4 Cuerpo del acta — columnas por estudiante

Las columnas del acta varían según el nivel:

**Primaria — columnas del acta:**

```
N° | Código | DNI | Apellidos y Nombres |
[Una columna por área curricular con calificativo anual] |
Resultado final (PROMOVIDO / PERMANECE / RECUPERACIÓN)
```

> El calificativo del área en el acta es el **promedio anual del área** en escala literal (AD/A/B/C), calculado a partir de los calificativos de todos los periodos.

**Secundaria — columnas del acta:**

```
N° | Código | DNI | Apellidos y Nombres |
[Una columna por área curricular con promedio anual 0-20] |
Resultado final (PROMOVIDO / PERMANECE / RECUPERACIÓN)
```

### 5.5 Pie del acta oficial

```
Docentes responsables por área:
  [Área] — [Apellidos y Nombres del docente] — DNI — Firma

Firma del Director:
  [Apellidos y Nombres] — DNI — Firma — Sello de la IE

Número total de estudiantes:
  Promovidos: [N]  |  Permanecen: [N]  |  En recuperación: [N]  |  Retirados: [N]
```

### 5.6 Lo que genera nuestro sistema para preparar el acta

Nuestro sistema **no genera el acta oficial** — esa es responsabilidad exclusiva del SIAGIE. Lo que sí genera es:

1. **Reporte borrador del acta** — en PDF interno con el mismo formato y datos, para que el director lo revise antes de aprobar en el SIAGIE. Detecta errores antes de que sean definitivos.

2. **Excel de cierre de año** — con los promedios anuales calculados por el sistema, listo para subir al SIAGIE y que este genere el acta oficial.

3. **Reporte de resultados** para el director — tabla de promovidos, en permanencia y en recuperación por sección, con indicadores de gestión.

```
Borrador de acta: nuestro sistema → director revisa
Excel de cierre:  nuestro sistema → director sube al SIAGIE
Acta oficial:     SIAGIE la genera con los datos cargados → director aprueba
```

### 5.7 Proceso de cierre de año en nuestro sistema

```
1. El director ejecuta "Cierre de año" en nuestro sistema
2. El sistema calcula:
   a. Promedio anual de cada área por estudiante
      (a partir de todos los periodos con su peso configurado)
   b. Resultado final por estudiante según las reglas de promoción
      (motor de promoción del Doc 2)
   c. Lista de estudiantes en recuperación (con áreas pendientes)

3. El sistema muestra el "Borrador de acta" en pantalla y PDF

4. El director revisa y puede corregir casos especiales
   (con justificación registrada en el sistema)

5. El director descarga el Excel de cierre de año para subir al SIAGIE

6. El director sube el Excel al SIAGIE y genera el acta oficial

7. El director marca en nuestro sistema: "Acta generada en SIAGIE ✓"
   → siagie_sync_log.estado = 'CARGADO_OK'
```

---

## 6. Documento 5 — Certificado Oficial de Estudios

### 6.1 Qué es y para qué sirve

El Certificado Oficial de Estudios acredita que un estudiante cursó y aprobó determinados grados en la IE. Es el documento que el estudiante necesita para traslados, postulaciones a becas, ingreso a instituciones de educación superior, trámites ante entidades del Estado, etc.

- **Quién lo emite:** El director a través del SIAGIE (módulo "Mi Certificado")
- **Cuándo:** A solicitud del estudiante o apoderado, en cualquier momento
- **Validez:** Plena validez oficial ante cualquier entidad del Estado
- **Costo:** Gratuito en IE públicas. Las IE privadas pueden cobrar un trámite administrativo.
- **Validación UGEL:** Desde R.M. 452-2025, la UGEL valida solicitudes en el módulo "Mi Certificado" del SIAGIE en un plazo máximo de 25 días hábiles cuando hay inconsistencias en los datos históricos.

### 6.2 Contenido del certificado oficial

```
CERTIFICADO OFICIAL DE ESTUDIOS

IE:              [Nombre oficial]
Código Modular:  [7 dígitos]
DRE / UGEL:      [Nombre]

CERTIFICA QUE:
Apellidos y Nombres: [del estudiante]
DNI:                 [8 dígitos]
Código de estudiante: [14 dígitos]

CURSÓ Y APROBÓ los siguientes grados:

Nivel    | Grado | Año Escolar | Resultado
---------|-------|-------------|----------
PRIMARIA | 1°    | 2018        | PROMOVIDO
PRIMARIA | 2°    | 2019        | PROMOVIDO
...
SECUNDARIA | 5°   | 2025        | PROMOVIDO

El presente certificado se expide para los fines que el interesado estime conveniente.

[Ciudad], [DD de mes de AAAA]

_______________________
[Nombres del Director]
Director
DNI [XXXXXXXX]
Sello de la IE
```

### 6.3 Lo que genera nuestro sistema para este documento

El certificado oficial solo lo genera el SIAGIE. Sin embargo, nuestro sistema puede ofrecer:

1. **Constancia interna** — PDF generado por nuestro sistema con los grados cursados en la IE, útil para trámites internos o para el apoderado mientras espera el certificado oficial del SIAGIE.

2. **Historial académico del estudiante** — vista en el portal del apoderado con todos los grados, años y resultados registrados en nuestro sistema.

3. **Verificación de consistencia** — antes de que el director genere el certificado en SIAGIE, nuestro sistema puede mostrar si los datos de años anteriores están completos y sin inconsistencias.

---

## 7. Resumen: qué genera cada sistema

| Documento | Nuestro sistema | SIAGIE |
|---|---|---|
| Nómina de matrícula | Excel de carga masiva (input al SIAGIE) | PDF oficial con validez legal |
| Informe de Progreso (libreta) | **PDF interno personalizado con logo del colegio** | PDF genérico MINEDU (opcional) |
| Registro Auxiliar | PDF/Excel de uso interno del docente | No lo genera |
| Acta Consolidada de Evaluación | Borrador PDF + Excel de cierre de año (input al SIAGIE) | **PDF oficial — el único con validez legal** |
| Certificado Oficial de Estudios | Constancia interna provisional | **PDF oficial — el único con validez legal** |

---

## 8. Tecnología de generación de PDF

Para generar los documentos PDF internos (libreta, registro auxiliar, borrador de acta, constancia interna), se recomienda:

### 8.1 Stack recomendado (Laravel)

| Librería | Uso | Observaciones |
|---|---|---|
| **DomPDF** (`barryvdh/laravel-dompdf`) | Libretas y documentos simples | Bueno para HTML/CSS estático. Limitaciones con layouts complejos |
| **Snappy** (`barryvdh/laravel-snappy`) | Documentos con diseño complejo | Usa wkhtmltopdf — mejor calidad pero requiere binario en el servidor |
| **TCPDF** | Tablas grandes (actas con muchas columnas) | Mejor manejo de tablas anchas y páginas en landscape |

> **Recomendación:** DomPDF para libretas (diseño tipo carta, no muy denso). TCPDF para el borrador de acta (tabla con muchas columnas de competencias que puede requerir orientación horizontal).

### 8.2 Plantillas de documentos

Las plantillas deben estar en Blade (Laravel) con variables inyectadas:

```
resources/views/pdf/
  ├── libreta/
  │   ├── primaria.blade.php      ← Libreta con escala AD/A/B/C
  │   └── secundaria.blade.php    ← Libreta con escala numérica
  ├── acta/
  │   ├── borrador_primaria.blade.php
  │   └── borrador_secundaria.blade.php
  ├── nomina/
  │   └── listado_interno.blade.php
  └── constancia/
      └── estudios.blade.php
```

### 8.3 Configuración por tenant

Cada tenant puede personalizar:

```sql
CREATE TABLE tenant_pdf_config (
    tenant_id           UUID PRIMARY KEY,
    logo_url            VARCHAR(500),       -- URL del logo en S3/R2
    color_primario      VARCHAR(7),         -- Hex ej: #1A5276
    color_secundario    VARCHAR(7),
    nombre_director     VARCHAR(200),
    cargo_director      VARCHAR(100) DEFAULT 'Director(a)',
    pie_documento       TEXT,               -- Texto adicional en pie de página
    mostrar_foto_est    BOOLEAN DEFAULT FALSE, -- Si muestra foto del estudiante
    escala_interna      VARCHAR(20),        -- NULL = usa la oficial MINEDU
    incluir_asistencia  BOOLEAN DEFAULT TRUE,
    incluir_firma_apoderado BOOLEAN DEFAULT TRUE
);
```

---

## 9. Flujo de aprobación de documentos

Antes de entregar cualquier documento a las familias, el flujo de aprobación debe ser:

```
DOCENTE
  Ingresa calificativos y conclusiones descriptivas
  en el sistema durante el periodo
        │
        ▼ (al cierre del periodo)
DIRECTOR
  Revisa el borrador de libreta (vista previa en pantalla)
  Aprueba el periodo: estado → CERRADO
        │
        ▼
SISTEMA
  Genera los PDF de todas las libretas de la sección
  Marca el periodo como APROBADO_DIRECTOR
        │
        ▼
SECRETARÍA / TUTOR
  Distribuye las libretas:
  - Portal web (apoderado las descarga)
  - Email con PDF adjunto
  - WhatsApp (si está configurado)
  - Impresión física (export en lote)
        │
        ▼
SISTEMA
  Registra la entrega en informe_progreso_entrega
  Actualiza estado a DISTRIBUIDO
```

---

## 10. Resumen de implicancias técnicas

| # | Implicancia | Tabla / Módulo |
|---|---|---|
| 1 | La nómina oficial la genera el SIAGIE; nuestro rol es proveer el Excel de entrada sin errores | `SiagieExporter.generarExcelMatricula()` |
| 2 | La libreta es el único documento interno que nuestro sistema genera completamente en PDF | Motor PDF (DomPDF/Snappy) + plantillas Blade por nivel |
| 3 | Las plantillas de libreta son personalizables por tenant (logo, colores, pie de página) | `tenant_pdf_config` |
| 4 | El acta oficial la genera el SIAGIE; nuestro rol es generar el borrador y el Excel de cierre | `PromocionService.calcularCierreAnual()` + `SiagieExporter.generarExcelCierre()` |
| 5 | El borrador de acta usa orientación landscape (muchas columnas de competencias) | TCPDF con `SetPageOrientation('L')` |
| 6 | El cierre de año tiene un flujo: calcular → revisar → corregir casos especiales → exportar | Estado `BORRADOR → REVISADO → EXPORTADO` en `cierre_anio` |
| 7 | La entrega de libreta debe quedar auditada (cuándo, a quién, por qué canal) | `informe_progreso_entrega` |
| 8 | El certificado oficial solo lo genera el SIAGIE; nuestro sistema ofrece constancia interna provisional | Plantilla `constancia_estudios.blade.php` |
| 9 | Los documentos del director requieren su firma digital o espacio para firma escaneada | Campo `firma_url` en `tenant_datos_minedu` |
| 10 | La resolución directoral de nómina debe ser configurable por sección y año escolar | `nomina_config.rd_numero` + `nomina_config.rd_fecha` por tenant/año/grado/sección |
| 11 | El borrador de acta permite al director detectar errores antes de cargar al SIAGIE — esto reduce las rectificaciones con UGEL | Feature de alto valor — enfatizar en el pitch comercial |

---

## 11. Próximo documento

**Documento 6 — Schema de Base de Datos**  
Modelo de datos completo para el sistema multitenant EBR: tablas de configuración de tenant, estudiantes, matrículas, áreas, competencias, notas por periodo, asistencia diaria, calendario escolar, cierre de año y sincronización SIAGIE. Incluye las relaciones, índices recomendados y consideraciones de rendimiento.

---

*Documento generado como parte de la serie de contexto técnico-legal para el sistema multitenant de gestión escolar EBR Perú.*  
*Los formatos de documentos oficiales son definidos por el MINEDU y pueden actualizarse cada año — verificar contra el SIAGIE al inicio de cada año escolar.*
