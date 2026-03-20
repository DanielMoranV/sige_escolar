# Documento 4 — Integración con SIAGIE
## Sistema de Gestión Escolar · Educación Básica Regular (EBR) · Perú

> **Serie:** Contexto Legal y Técnico para Sistema Multitenant de Gestión Escolar Peruana  
> **Documento:** 4 de 6  
> **Alcance:** EBR — Estrategia de integración manual con el sistema oficial MINEDU  
> **Última revisión:** Marzo 2026  
> **Decisión de alcance v1:** La integración con SIAGIE es **manual asistida** — el sistema genera los archivos de exportación listos para cargar y acepta importación desde archivos del SIAGIE. No hay automatización web (Playwright) en esta versión. La automatización queda documentada como hoja de ruta para versiones futuras.

---

## 1. Estado actual del SIAGIE (arquitectura real)

### 1.1 Versiones coexistentes

El MINEDU opera actualmente **dos versiones del SIAGIE en paralelo**:

| Versión | URL | Estado | Uso actual |
|---|---|---|---|
| **SIAGIE v3** | `sistemas10.minedu.gob.pe/siagie3/` | Activo (estable) | Calificaciones, cierre de año, nóminas, actas. Principal desde nov. 2024 |
| **SIAGIE v5** | `web.siagie.minedu.gob.pe/` | En renovación/mantenimiento | Matrícula en algunas UGEL; suspendido parcialmente desde nov. 2024 |

> **Relevancia para v1:** Como la integración es manual, la coexistencia de versiones solo afecta al director cuando sube los archivos. Nuestros exports deben ser compatibles con ambas versiones (el formato Excel es el mismo en v3 y v5).

### 1.2 Dos modos de uso del SIAGIE para las IEs

| Modo | Descripción | Implicancia para nuestro sistema |
|---|---|---|
| **Uso básico** | Carga de datos mínimos mediante plantillas Excel para generar nóminas y actas. | Nuestro objetivo v1: generar estos Excels perfectamente |
| **Uso completo** | Registro detallado por periodo, acceso de docentes, seguimiento de asistencia | El director puede usar el modo completo del SIAGIE en paralelo con nuestro sistema |

### 1.3 No existe API pública oficial

El SIAGIE **no expone ninguna API REST ni SOAP pública** con documentación oficial para sistemas externos. Los únicos métodos disponibles son:

1. **Exportación/importación de plantillas Excel** — el método oficial, el que usamos en v1
2. **Automatización web** (Playwright/Selenium) — no oficial, reservado para versiones futuras
3. **Doble registro manual** — lo que hace hoy la mayoría de colegios sin nuestro sistema

---

## 2. Modelo de integración v1: exportación e importación manual asistida

### 2.1 Principio de diseño

```
NUESTRO SISTEMA                              SIAGIE
─────────────────────                        ──────────────────────────
Fuente primaria de datos      ──Excel──►     Repositorio oficial del Estado
  (matrícula, notas, asistencia)   ▲         (fuente de verdad legal)
                                   │
                              Director/
                              Secretaria
                              (acción manual)

Importación inicial      ◄──Excel──          Datos históricos del colegio
  (onboarding)
```

**El flujo general para cada módulo es siempre el mismo:**

```
1. El docente/secretaria trabaja en nuestro sistema durante el año
2. Al llegar el momento de reportar al SIAGIE, el director abre
   el módulo "Exportar al SIAGIE" en nuestro sistema
3. Nuestro sistema genera el Excel en el formato exacto del SIAGIE
4. El director lo descarga y lo sube al SIAGIE manualmente
5. El SIAGIE confirma si hay errores o el proceso fue exitoso
6. El director registra en nuestro sistema si la carga fue exitosa
```

### 2.2 Mapa de sincronización por módulo

| Módulo | Frecuencia | Acción en nuestro sistema | Acción en SIAGIE |
|---|---|---|---|
| **Matrícula** | Inicio de año (enero–febrero) | Generar Excel masivo de matrícula | Director sube Excel → SIAGIE genera nómina |
| **Asistencia** | Mensual | Generar Excel de resumen mensual por sección | Director sube Excel por grado/sección |
| **Calificaciones** | Por periodo (bim/trim/sem) | Generar Excel con notas por sección y periodo | Director sube Excel → SIAGIE registra calificativos |
| **Notas finales** | Cierre de año (diciembre) | Generar Excel de promedios anuales finales | Director sube y genera actas en SIAGIE |
| **Datos de docentes** | Inicio de año | Listado referencial para que el director ingrese en SIAGIE | Director ingresa manualmente (son pocos) |
| **Importación inicial** | Una sola vez (onboarding) | Importar Excel exportado del SIAGIE | Director exporta nóminas/actas del SIAGIE |

---

## 3. Módulo 1 — Exportación de matrícula

### 3.1 Datos requeridos por el SIAGIE para matricular un estudiante

El SIAGIE valida los datos del estudiante contra RENIEC. Por eso es crítico que nuestro sistema almacene los datos **exactamente como los tiene RENIEC**.

**Datos del estudiante:**

| Campo | Fuente en nuestro sistema | Observación |
|---|---|---|
| Tipo de documento | Selección al matricular | DNI / CE / Pasaporte / Sin doc. |
| Número de DNI | Ingresado por el usuario | Validado contra RENIEC al momento de la matrícula |
| Apellido paterno | Obtenido de RENIEC | Inmutable — viene de RENIEC vía API |
| Apellido materno | Obtenido de RENIEC | Inmutable — viene de RENIEC vía API |
| Nombres | Obtenido de RENIEC | Inmutable — viene de RENIEC vía API |
| Fecha de nacimiento | Obtenido de RENIEC | Formato DD/MM/AAAA en el Excel |
| Género | Obtenido de RENIEC | M / F |
| UBIGEO de nacimiento | Obtenido de RENIEC | 6 dígitos |
| Código del estudiante SIAGIE | Calculado: `000000` + DNI | Ver sección 3.2 |

**Datos de matrícula:**

| Campo | Descripción |
|---|---|
| Año escolar | Año en curso |
| Nivel | PRIMARIA / SECUNDARIA |
| Grado | 1 al 6 (primaria) / 1 al 5 (secundaria) |
| Sección | Letra o nombre |
| Tipo de matrícula | CONTINUIDAD / INGRESO / REINCORPORACION / TRASLADO |
| Condición | PROMOVIDO / REPITE / INGRESANTE |
| Fecha de matrícula | Fecha de registro en nuestro sistema |
| DNI apoderado | Validado al registrar la familia |
| Nombres apoderado | Obtenido de RENIEC o ingresado manualmente |
| Parentesco | PADRE / MADRE / APODERADO / OTRO |

**Datos opcionales (incluir si están registrados):**

| Campo | Valores posibles |
|---|---|
| Autoidentificación étnica | QUECHUA / AIMARA / INDIGENA_AMAZONICO / AFRODESCENDIENTE / OTRO |
| Lengua materna | CASTELLANO / QUECHUA / AIMARA / OTRA |
| Exoneración Ed. Física | SI / NO + motivo |
| Exoneración Ed. Religiosa | SI / NO |

### 3.2 Código del estudiante SIAGIE

```
Para estudiantes CON DNI:
  codigo_siagie = "000000" + DNI (8 dígitos)
  Ejemplo: DNI 72345678  →  codigo_siagie = "00000072345678"

Para estudiantes SIN DNI:
  El SIAGIE genera el código al crear el registro.
  El director debe ingresar ese código manualmente en nuestro sistema
  después de hacer el registro en el SIAGIE.
```

> **Campo en BD:** `estudiantes.codigo_siagie VARCHAR(14)`. Para estudiantes con DNI se calcula automáticamente al registrar. Para estudiantes sin DNI queda `NULL` hasta que el director lo ingrese manualmente tras el registro en SIAGIE.

### 3.3 Validación RENIEC al matricular

La validación RENIEC ocurre **en el momento de registrar al estudiante** en nuestro sistema, no al exportar. Esto garantiza que los datos que llegarán al SIAGIE ya coincidan con los de RENIEC.

```
Secretaria ingresa DNI del estudiante
        │
        ▼
Sistema consulta API RENIEC (proveedor alternativo v1)
        │
  ┌─────┴──────────────────────────────┐
  │ Datos obtenidos:                   │
  │  - nombres y apellidos completos   │
  │  - fecha de nacimiento             │
  │  - género                          │
  │  - UBIGEO de nacimiento            │
  └─────┬──────────────────────────────┘
        │
        ▼
Formulario pre-llenado — secretaria completa
grado, sección, apoderado, tipo de matrícula, etc.
        │
        ▼
Se guarda en nuestro sistema ← fuente primaria
        │
        ▼ (al momento de exportar)
Excel generado con datos ya validados por RENIEC
→ SIAGIE los acepta sin error de validación
```

**Acceso a RENIEC para sistemas privados:**

| Opción | Descripción | Costo referencial |
|---|---|---|
| **Proveedores API Perú** | APIs Perú, APIRUC, Facturación Perú y similares | ~S/. 0.05–0.10 por consulta |
| **RENIEC oficial** | Requiere convenio con RENIEC — proceso largo | Variable por volumen |

> **Recomendación v1:** Usar un proveedor alternativo. Un colegio de 500 estudiantes hace ~500 consultas al año = S/. 25–50/año.

### 3.4 Estructura del Excel de matrícula masiva

Nombre del archivo:

```
MatriculaIE_{codigo_modular}_{anio_escolar}.xlsx
Ejemplo: MatriculaIE_1234567_2025.xlsx
```

Columnas (un row por estudiante):

```
Col A:  DNI_ESTUDIANTE
Col B:  APELLIDO_PATERNO
Col C:  APELLIDO_MATERNO
Col D:  NOMBRES
Col E:  FECHA_NACIMIENTO        (DD/MM/AAAA)
Col F:  GENERO                  (M / F)
Col G:  UBIGEO_NACIMIENTO       (6 dígitos)
Col H:  NIVEL                   (PRIMARIA / SECUNDARIA)
Col I:  GRADO                   (1, 2, 3, 4, 5, 6)
Col J:  SECCION                 (A, B, C, ...)
Col K:  TIPO_MATRICULA          (CONTINUIDAD / INGRESO / REINCORPORACION / TRASLADO)
Col L:  CONDICION               (PROMOVIDO / REPITE / INGRESANTE)
Col M:  FECHA_MATRICULA         (DD/MM/AAAA)
Col N:  DNI_APODERADO
Col O:  NOMBRES_APODERADO
Col P:  PARENTESCO              (PADRE / MADRE / APODERADO / OTRO)
Col Q:  LENGUA_MATERNA          (CASTELLANO / QUECHUA / AIMARA / OTRA)
Col R:  ETNIA                   (opcional)
Col S:  EXONERADO_EDUFISICA     (SI / NO)
Col T:  EXONERADO_RELIGION      (SI / NO)
```

> **Nota técnica:** El formato exacto puede variar entre versiones del SIAGIE. Antes de cada inicio de año escolar, descargar la plantilla actualizada desde el SIAGIE y verificar que nuestro generador produce la misma estructura. Mantener la plantilla descargada como fixture de prueba en el repositorio.

---

## 4. Módulo 2 — Exportación de calificaciones

### 4.1 Flujo del proceso

```
Al cierre de cada periodo:

1. Director cierra el periodo en nuestro sistema
2. Entra a: Exportar → Calificaciones al SIAGIE
3. Selecciona: nivel → grado → sección → periodo
4. Sistema valida que todos los estudiantes tienen nota
   en todas las competencias del periodo
   · Si hay pendientes: bloquea y muestra lista
   · Si está completo: habilita la descarga
5. Director descarga el Excel
6. Director lo sube en SIAGIE:
   Evaluación → Registro de calificaciones →
   Registro de calificaciones por periodo desde Excel →
   Seleccionar diseño curricular + periodo + grado + sección →
   Cargar notas
7. SIAGIE muestra resultado (verde = OK, rojo = errores)
8. Director marca "Enviado al SIAGIE ✓" en nuestro sistema
```

### 4.2 Estructura del Excel de calificaciones

Nombre del archivo:

```
CalificacionesIE_{codigo_modular}_{grado}{seccion}_{periodo}_{anio}.xlsx
Ejemplo: CalificacionesIE_1234567_3A_BIM1_2025.xlsx
```

Estructura (primaria — escala literal):

```
Col A:  CODIGO_SIAGIE           (14 dígitos)
Col B:  DNI
Col C:  APELLIDOS_NOMBRES       ("APAT AMAT, NOMBRES")
Col D…: [Una columna por competencia, en el orden que espera el SIAGIE]
         Valores: AD / A / B / C / EXO
Col N:  CONCLUSION_DESCRIPTIVA  (texto, hasta 500 caracteres)
```

Estructura (secundaria — escala numérica):

```
Col A:  CODIGO_SIAGIE
Col B:  DNI
Col C:  APELLIDOS_NOMBRES
Col D…: [Una columna por competencia]
         Valores: 0 al 20 (entero)
Col N:  CONCLUSION_DESCRIPTIVA
```

> **Crítico:** El orden de competencias en el Excel debe coincidir exactamente con el que el SIAGIE espera para ese grado, nivel y diseño curricular. Mantener una tabla `competencias_siagie_orden (nivel, grado, area_id, competencia_id, posicion_columna)` con el orden oficial. Si el orden no coincide, el SIAGIE asigna las notas a las competencias incorrectas.

### 4.3 Validaciones antes de generar el Excel

| Validación | Comportamiento |
|---|---|
| Todos los estudiantes tienen nota en todas las competencias del periodo | Bloquear — mostrar lista de pendientes |
| El periodo está en estado CERRADO | Advertir si está ABIERTO (el director puede forzar) |
| Todos los estudiantes tienen `codigo_siagie` registrado | Advertir — los que no tienen código se excluyen del Excel |
| Calificativos dentro del rango permitido | No debería ocurrir si el formulario valida al ingresar |

---

## 5. Módulo 3 — Exportación de asistencia

### 5.1 Qué registra el SIAGIE de asistencia

El SIAGIE trabaja con **totales mensuales** por estudiante. Nuestro sistema agrega los registros diarios para generar ese resumen.

### 5.2 Cálculo de totales mensuales

```
Para cada estudiante, por mes:

dias_efectivos_mes =
  COUNT(calendario_escolar WHERE tipo = 'LECTIVO' AND mes = M
    AND fecha >= matricula.fecha_inicio)
  -- Solo días desde que el estudiante está matriculado

dias_asistidos =
  COUNT(asistencia_diaria WHERE estado IN ('P','T','LM') AND mes = M)

dias_falta_justificada =
  COUNT(asistencia_diaria WHERE estado = 'FJ' AND mes = M)

dias_falta_injustificada =
  dias_efectivos_mes - dias_asistidos - dias_falta_justificada

-- Los días NM (no matriculado) no entran en ningún total
```

### 5.3 Estructura del Excel de asistencia mensual

Nombre del archivo:

```
AsistenciaIE_{codigo_modular}_{anio}_{mes}_{grado}{seccion}.xlsx
Ejemplo: AsistenciaIE_1234567_2025_04_3A.xlsx
```

Estructura:

```
Encabezado:
  Código IE | Año escolar | Grado | Sección | Mes | Días efectivos del mes

Filas (un row por estudiante):
Col A:  CODIGO_SIAGIE
Col B:  DNI
Col C:  APELLIDOS_NOMBRES
Col D:  DIAS_ASISTIDOS
Col E:  DIAS_FALTA_JUSTIFICADA
Col F:  DIAS_FALTA_INJUSTIFICADA
```

### 5.4 Flujo de exportación de asistencia

```
Al cierre de cada mes:

1. Director/secretaria abre: Exportar → Asistencia al SIAGIE
2. Selecciona: mes, grado y sección
3. Sistema muestra preview de totales por estudiante
   (el director puede detectar errores antes de exportar)
4. Director descarga el Excel
5. Director sube en SIAGIE:
   Asistencia → Asistencia mensual IE →
   Carga de asistencia Excel →
   Seleccionar grado y mes → Procesar plantilla Excel
6. SIAGIE muestra resultado (verde / rojo)
7. Director marca "Enviado ✓" en nuestro sistema
```

---

## 6. Importación de datos desde el SIAGIE (onboarding)

### 6.1 Para qué sirve

Cuando un colegio se incorpora al sistema y ya usa el SIAGIE, se importan sus datos históricos para que el sistema tenga contexto completo desde el primer día.

### 6.2 Archivos que el SIAGIE permite exportar

| Documento | Cómo exportarlo del SIAGIE | Contenido |
|---|---|---|
| **Nómina de matrícula** | Matrícula → Nómina → Exportar | Estudiantes del año con datos personales y de matrícula |
| **Acta consolidada de evaluación** | Evaluación → Actas → Exportar | Calificativos finales por área y competencia |
| **Registro de asistencia** | Asistencia → Reportes → Exportar | Totales mensuales por estudiante |

### 6.3 Proceso de importación inicial

```
1. Director exporta del SIAGIE:
   - Nómina de matrícula del año actual (y anteriores si los necesita)
   - Actas de evaluación de años anteriores (para historial)

2. Director sube los archivos en nuestro sistema:
   Configuración → Importar datos del SIAGIE → Seleccionar tipo

3. Nuestro sistema parsea el archivo y:
   - Crea registros de estudiantes con su codigo_siagie
   - Registra las matrículas del año actual
   - Registra calificativos históricos (años anteriores como periodo ANUAL)

4. Sistema muestra reporte de importación:
   - N registros importados correctamente
   - M registros con advertencias (ej: DNI no encontrado en RENIEC)
   - K registros con error (ej: campos vacíos requeridos)

5. Director revisa y corrige manualmente los casos con error
```

### 6.4 Campos mapeados en la importación

| Campo en archivo SIAGIE | Campo en nuestro sistema |
|---|---|
| Código de estudiante (14 dígitos) | `estudiantes.codigo_siagie` |
| DNI | `estudiantes.dni` |
| Apellidos y nombres | `estudiantes.apellido_paterno`, `apellido_materno`, `nombres` |
| Grado / Sección | `matriculas.grado_id`, `matriculas.seccion_id` |
| Tipo de matrícula | `matriculas.tipo` |
| Condición final | `matriculas.condicion_final` |
| Calificativo por competencia | `notas_periodo.calificativo` (periodo = ANUAL) |

---

## 7. Panel de estado de sincronización

Para que el director sepa qué está sincronizado y qué falta, el sistema mantiene un registro de estado por módulo y periodo.

```sql
CREATE TABLE siagie_sync_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    modulo          VARCHAR(30) NOT NULL,
    -- MATRICULA | ASISTENCIA | CALIFICACIONES | NOTAS_FINALES

    anio_escolar    INTEGER NOT NULL,
    nivel           VARCHAR(20),
    grado           INTEGER,
    seccion         VARCHAR(10),
    periodo         VARCHAR(20),   -- BIM1, BIM2, MES_ABRIL, ANUAL, etc.
    mes             INTEGER,

    estado          VARCHAR(25) NOT NULL DEFAULT 'PENDIENTE',
    -- PENDIENTE | EXPORTADO | CARGADO_OK | CARGADO_CON_ERRORES

    exportado_en    TIMESTAMP,
    exportado_por   UUID REFERENCES usuarios(id),
    cargado_en      TIMESTAMP,
    cargado_por     UUID REFERENCES usuarios(id),
    observacion     TEXT,
    archivo_nombre  VARCHAR(200),

    creado_en       TIMESTAMP DEFAULT NOW()
);
```

El panel que ve el director:

```
PANEL DE SINCRONIZACIÓN SIAGIE — 2025   [Primaria · 3° A]

Matrícula inicial        ✅ Cargado OK      15/02/2025
Asistencia — Marzo       ✅ Cargado OK      02/04/2025
Asistencia — Abril       ✅ Cargado OK      03/05/2025
Asistencia — Mayo        ⏳ Pendiente       —
Calificaciones — Bim 1   ✅ Cargado OK      12/05/2025
Calificaciones — Bim 2   ⬇️ Excel listo     (sin cargar al SIAGIE aún)
```

---

## 8. Datos de la IE que el sistema debe almacenar

```sql
CREATE TABLE tenant_datos_minedu (
    tenant_id         UUID PRIMARY KEY REFERENCES tenants(id),

    -- Identificadores MINEDU (obligatorios para cualquier exportación)
    codigo_modular    VARCHAR(7)   NOT NULL,  -- 7 dígitos, ej: "1234567"
    anexo             VARCHAR(5)   DEFAULT '0',
    codigo_local      VARCHAR(10),
    nombre_oficial    VARCHAR(200) NOT NULL,  -- Nombre exacto tal como figura en ESCALE

    -- Jurisdicción
    dre_codigo        VARCHAR(10),
    dre_nombre        VARCHAR(200),
    ugel_codigo       VARCHAR(10),
    ugel_nombre       VARCHAR(200),
    ubigeo_distrito   VARCHAR(6),

    -- Tipo de gestión
    tipo_gestion      VARCHAR(20) DEFAULT 'PRIVADA',  -- PUBLICA | PRIVADA | CONVENIO
    modalidad         VARCHAR(20) DEFAULT 'EBR',

    -- Director vigente (para encabezados de documentos oficiales)
    director_dni      VARCHAR(8),
    director_nombres  VARCHAR(200),
    director_cargo    VARCHAR(100) DEFAULT 'Director',

    actualizado_en    TIMESTAMP DEFAULT NOW()
);
```

**¿Cómo obtiene el colegio sus datos MINEDU?**

| Dato | Cómo obtenerlo |
|---|---|
| `codigo_modular` | Lo conoce el director. También en `escale.minedu.gob.pe` → Padrón de IIEEs |
| `nombre_oficial` | Aparece en cualquier documento del SIAGIE de la IE |
| `ugel` / `dre` | El director lo sabe. También en ESCALE |
| `ubigeo_distrito` | Código INEI de 6 dígitos del distrito. Tabla de UBIGEOs disponible públicamente |

---

## 9. Hoja de ruta de integración

### v1 — Implementación actual (manual asistida)

```
✅ Validación de DNI via API RENIEC (proveedor alternativo)
✅ Cálculo automático de codigo_siagie para estudiantes con DNI
✅ Generador de Excel: matrícula masiva (formato SIAGIE)
✅ Generador de Excel: calificaciones por periodo y sección
✅ Generador de Excel: asistencia mensual agregada
✅ Importador de Excel: nóminas y actas del SIAGIE (onboarding)
✅ Panel de estado de sincronización (siagie_sync_log)
✅ Tabla tenant_datos_minedu con código modular y datos del director
```

### v2 — Automatización selectiva (futuro)

```
⬜ Playwright: carga automática de asistencia mensual (bajo riesgo)
⬜ Playwright: verificación de resultado post-carga (verde/rojo)
⬜ Notificación al director del resultado de la carga automática
⬜ Gestión encriptada de credenciales SIAGIE por tenant
⬜ Adaptadores para SIAGIE v3 y v5 (patrón Strategy)
```

### v3 — Integración profunda (futuro)

```
⬜ Playwright: carga de calificaciones (con doble confirmación del director)
⬜ Sincronización de traslados entre IEs
⬜ Integración con módulo "Mi Certificado" del SIAGIE
⬜ Detección automática de cambios de versión del SIAGIE
```

---

## 10. Resumen de implicancias técnicas (v1)

| # | Implicancia | Tabla / Servicio |
|---|---|---|
| 1 | Toda integración v1 es por Excel — no hay automatización web | `SiagieExporter` (genera Excel) · `SiagieImporter` (onboarding) |
| 2 | La validación RENIEC ocurre al matricular, no al exportar | Servicio `ReniecValidator` en módulo de matrícula |
| 3 | El código del estudiante = `000000` + DNI para estudiantes con DNI | Campo `codigo_siagie` calculado automáticamente |
| 4 | Estudiantes sin DNI requieren que el director ingrese el código manualmente | Campo `codigo_siagie` nullable hasta completarse |
| 5 | El código modular de la IE es obligatorio para todos los archivos de exportación | `tenant_datos_minedu.codigo_modular` |
| 6 | El orden de competencias en el Excel de calificaciones debe coincidir con el SIAGIE | Tabla `competencias_siagie_orden` con posición por área, nivel y grado |
| 7 | El Excel de asistencia usa totales mensuales calculados desde registros diarios | Servicio `AsistenciaAgregador` |
| 8 | El panel de sync permite al director saber qué falta cargar | `siagie_sync_log` con estados PENDIENTE / EXPORTADO / CARGADO_OK |
| 9 | La importación inicial acepta nóminas y actas exportadas del SIAGIE | Servicio `SiagieImporter` — crítico para el onboarding |
| 10 | El formato del Excel puede cambiar entre versiones del SIAGIE | Mantener fixture de plantilla actualizable sin redeploy |
| 11 | Los datos del director deben estar actualizados para documentos oficiales | `tenant_datos_minedu.director_*` editable desde el panel |

---

## 11. Próximo documento

**Documento 5 — Documentos Oficiales MINEDU**  
Estructura y contenido requerido de cada documento oficial que el sistema debe generar en PDF: nómina de matrícula, registro auxiliar de evaluación, libreta de notas (informe de progreso), acta consolidada de evaluación y certificado de estudios. Diferencias entre el documento interno del colegio y el documento oficial del SIAGIE.

---

*Documento generado como parte de la serie de contexto técnico-legal para el sistema multitenant de gestión escolar EBR Perú.*  
*Revisar el formato de las plantillas Excel al inicio de cada año escolar — el MINEDU puede actualizar la estructura sin previo aviso.*
