# Documento 3 — Gestión de Asistencia Estudiantil
## Sistema de Gestión Escolar · Educación Básica Regular (EBR) · Perú

> **Serie:** Contexto Legal y Técnico para Sistema Multitenant de Gestión Escolar Peruana  
> **Documento:** 3 de 6  
> **Alcance:** EBR — Nivel Primaria (1°–6°) y Secundaria (1°–5°)  
> **Norma base:** R.M. N° 587-2023-MINEDU (Lineamientos de Prestación del Servicio Educativo 2024) · R.M. N° 432-2020-MINEDU (SIAGIE)  
> **Última revisión:** Marzo 2026  

---

## 1. Principios generales del registro de asistencia

### 1.1 Obligatoriedad y finalidad

El registro de asistencia del estudiante al servicio educativo es de carácter **obligatorio** y lo realiza de manera oportuna el tutor y/o auxiliar de acuerdo a la modalidad, grado y sección.

La finalidad del registro, según la normativa vigente, es triple:

1. **Seguimiento de la trayectoria educativa:** Asociar la asistencia con los niveles de logro del estudiante para detectar correlaciones entre inasistencia y bajo rendimiento.
2. **Comunicación con la familia:** Informar al padre, madre, tutor o apoderado sobre las inasistencias y tardanzas del estudiante.
3. **Gestión directiva:** El directivo debe usar esta información para realizar seguimiento al bienestar y condiciones para el aprendizaje de cada estudiante.

### 1.2 Quién registra la asistencia

| Responsable | Qué registra | Cuándo |
|---|---|---|
| **Docente tutor / auxiliar** | Asistencia diaria de su sección (todos los estudiantes) | Cada día lectivo, al inicio de la jornada |
| **Docente de área** (secundaria) | Asistencia por sesión de clase en su área | Por cada sesión (opcional según reglamento interno del colegio) |
| **Secretaría** | Gestión administrativa de justificaciones y trámites | A solicitud del apoderado |
| **Director** | Supervisión y cierre de reportes mensuales | Mensual o según calendario |

> **Implicancia técnica:** El sistema debe diferenciar entre **asistencia de sección** (registro principal, obligatorio, por día) y **asistencia por sesión de área** (registro optativo por hora de clase en secundaria). Ambos comparten la misma estructura base pero tienen distintos atributos.

---

## 2. Tipos de registro de asistencia

### 2.1 Estados diarios posibles por estudiante

| Código | Estado | Descripción |
|---|---|---|
| `P` | **Presente** | Asistió puntualmente |
| `T` | **Tardanza** | Llegó después de la hora de inicio establecida por la IE |
| `FI` | **Falta injustificada** | No asistió y no presentó justificación válida dentro del plazo |
| `FJ` | **Falta justificada** | No asistió pero presentó justificación aceptada por la IE |
| `PS` | **Permiso con salida** | Asistió y salió antes de la hora por autorización |
| `LM` | **Licencia médica** | Ausencia por motivo de salud con documentación médica |
| `—` | **Sin registro** | El docente no registró aún (solo válido en jornada activa) |

> **Nota:** La distinción entre `FI` y `FJ` no es inmediata. Una falta nace como injustificada y puede convertirse en justificada si el apoderado presenta la documentación dentro del plazo normativo.

### 2.2 Plazo para justificar una inasistencia

Ante una inasistencia o tardanza del estudiante al servicio educativo, el padre, madre, tutor o apoderado debe presentar la justificación respectiva **dentro del plazo de cinco (05) días hábiles** de ocurrido el hecho.

Este plazo es el estándar normativo nacional. Los colegios privados pueden establecer plazos más cortos en su reglamento interno (algunos exigen justificación al día siguiente), pero nunca más largo que el plazo normativo.

> **Implicancia técnica:** El sistema debe implementar un job o proceso automático que, al cumplirse el plazo de justificación configurado, cambie el estado de la falta de `PENDIENTE_JUSTIFICACION` a `FI` (injustificada) si no se ha registrado ninguna justificación. El plazo debe ser configurable por tenant (campo `dias_plazo_justificacion` en `tenant_config`).

### 2.3 Motivos de justificación reconocidos

Los motivos de justificación de inasistencia más comunes y reconocidos por la normativa y práctica peruana son:

| Código | Motivo | Documentación requerida |
|---|---|---|
| `ENF` | Enfermedad / malestar | Certificado médico o declaración jurada del apoderado |
| `FAM` | Emergencia familiar | Declaración jurada del apoderado |
| `MED` | Cita médica programada | Constancia de cita |
| `ACT` | Actividad oficial del colegio | Autorización del director |
| `DUE` | Duelo familiar | Declaración jurada |
| `VIA` | Viaje familiar | Solicitud previa del apoderado |
| `OTR` | Otro motivo aceptado | Declaración jurada + sustento |

---

## 3. Tardanzas

### 3.1 Definición y registro

La tardanza es el ingreso del estudiante a su IE después de la hora de inicio de clases establecida por la IE en su reglamento interno. A diferencia de las inasistencias, las tardanzas no requieren el mismo proceso de justificación, pero deben ser registradas.

### 3.2 Conversión de tardanzas acumuladas en falta

La norma peruana no establece un número fijo de tardanzas equivalente a una falta a nivel nacional — esto lo define cada IE en su reglamento interno. El estándar más extendido en colegios privados es:

```
3 tardanzas injustificadas acumuladas en el mes = 1 falta injustificada
```

> **Implicancia técnica:** La tabla de configuración del tenant (`tenant_config`) debe incluir el campo `tardanzas_por_falta INTEGER DEFAULT 3` para que cada colegio lo parametrice. El sistema debe calcular y mostrar esta conversión automáticamente en los reportes mensuales.

### 3.3 Tipos de tardanza

| Tipo | Descripción |
|---|---|
| **Tardanza leve** | Ingreso dentro de los primeros N minutos (configurable por IE, ej: primeros 15 min) |
| **Tardanza grave** | Ingreso después de N minutos del inicio. En algunos colegios equivale directamente a media falta |

---

## 4. Días lectivos y no lectivos

### 4.1 Tipos de día en el calendario escolar

El módulo de asistencia opera únicamente sobre **días lectivos**. El sistema debe conocer el calendario del año para saber en qué días se debe registrar asistencia.

| Tipo de día | Código | Se registra asistencia |
|---|---|---|
| Día lectivo normal | `LECTIVO` | ✅ Sí |
| Semana de gestión | `GESTION` | ❌ No (sin estudiantes) |
| Feriado nacional | `FERIADO` | ❌ No |
| Vacaciones escolares | `VACACION` | ❌ No |
| Día de suspensión de clases (lluvia, emergencia, etc.) | `SUSPENSION` | ❌ No (el director lo registra) |
| Día de actividad extracurricular (paseo, olimpiadas) | `ACTIVIDAD` | ⚠️ Depende — el colegio define si cuenta como asistencia |

> **Implicancia técnica:** La tabla `calendario_escolar` debe tener un registro por cada día del año con su `tipo_dia`. El sistema nunca debe mostrar el formulario de registro de asistencia en días no lectivos. El director debe poder marcar días especiales (suspensiones) desde el panel administrativo, propagando el cambio a todas las secciones.

### 4.2 Horas lectivas mínimas por nivel

La normativa exige un mínimo de horas de clase efectiva al año:

| Nivel | Horas lectivas mínimas anuales |
|---|---|
| Primaria | 1,100 horas |
| Secundaria | 1,200 horas |

Esta información es relevante para el módulo de recuperación de horas (cuando hay suspensiones) y para los reportes que el director debe presentar a la UGEL.

---

## 5. Umbrales de inasistencia y alertas

Este es uno de los módulos de mayor valor diferenciador del sistema: **detectar tempranamente a estudiantes en riesgo de abandono escolar** antes de que lo haga el SIAGIE.

### 5.1 El sistema "Alerta Escuela" del MINEDU (referencia)

El MINEDU implementó "Alerta Escuela", una herramienta integrada al SIAGIE para los directores, que muestra el riesgo de interrupción de estudios de cada estudiante según su sección y grado, diferenciándolos con tres colores: verde (bajo riesgo), amarillo (riesgo medio) y naranja (alto riesgo).

Nuestro sistema debe ofrecer una funcionalidad similar pero **en tiempo real**, sin esperar la sincronización con SIAGIE.

### 5.2 Umbrales de alerta recomendados (configurables)

Los siguientes umbrales son los más extendidos en la práctica de colegios privados peruanos. Deben ser parametrizables por tenant:

| Nivel de alerta | Condición por defecto | Color | Acción sugerida |
|---|---|---|---|
| 🟢 **Sin alerta** | < 10% de inasistencias injustificadas acumuladas | Verde | Ninguna |
| 🟡 **Alerta temprana** | 10% – 19% de inasistencias injustificadas | Amarillo | Notificar al apoderado automáticamente |
| 🟠 **Alerta media** | 20% – 29% de inasistencias injustificadas | Naranja | Citar al apoderado · Registrar en SIAGIE |
| 🔴 **Alerta crítica** | ≥ 30% de inasistencias injustificadas | Rojo | Protocolo de riesgo de abandono · Notificar a dirección |

> **Nota sobre el cálculo:** El porcentaje se calcula sobre el **total de días lectivos transcurridos hasta la fecha**, no sobre el total del año. Esto permite detectar el riesgo en tiempo real.

```
% inasistencias = (faltas_injustificadas_acumuladas / dias_lectivos_transcurridos) × 100
```

### 5.3 Alertas específicas adicionales

Además del porcentaje general, el sistema debe generar alertas por patrones específicos:

| Alerta | Condición | Destinatario |
|---|---|---|
| **Ausencia continua** | 3 o más días seguidos sin justificación | Tutor + Director |
| **Patrón semanal** | Inasistencias recurrentes el mismo día de la semana (ej: siempre lunes) | Tutor |
| **Inicio de periodo** | Inasistencias en los primeros 5 días lectivos del año o periodo | Director |
| **Ausencia sin comunicación** | El apoderado no ha reportado ni justificado en más de 2 días | Tutor |
| **Acumulado mensual alto** | Más de N faltas injustificadas en el mes (configurable, default: 5) | Director + Apoderado |

---

## 6. Notificaciones a la familia

### 6.1 Canales de notificación

El sistema debe soportar los siguientes canales, activables por tenant:

| Canal | Cuándo usarlo | Implementación |
|---|---|---|
| **Notificación push (app móvil)** | Inasistencia del día, alertas en tiempo real | Firebase / OneSignal |
| **WhatsApp Business API** | Notificación diaria de inasistencia, citaciones | API de WhatsApp Business |
| **Email** | Informes mensuales de asistencia, citaciones formales | SMTP / Resend |
| **SMS** | Fallback para apoderados sin smartphone | Twilio u operador local |
| **Mensaje interno (portal)** | Comunicaciones formales que quedan en el sistema | Módulo de mensajería propio |

### 6.2 Plantillas de notificación recomendadas

**Notificación diaria de inasistencia (WhatsApp/SMS):**
```
[COLEGIO] Sr./Sra. {apoderado}, le informamos que su hijo/a {estudiante} 
de {grado} "{seccion}" no asistió hoy {fecha}. 
Si es justificada, preséntela en secretaría en {plazo} días hábiles.
```

**Alerta de acumulado (email):**
```
Estimado/a {apoderado},
Su hijo/a {estudiante} acumula {N} inasistencias injustificadas 
({porcentaje}% de los días transcurridos).
Le solicitamos comunicarse con el tutor {tutor} para coordinar.
```

### 6.3 Registro de comunicaciones

Toda notificación enviada debe quedar registrada en el sistema con:
- Fecha y hora de envío
- Canal utilizado
- Estado de entrega (enviado / fallido / leído si el canal lo permite)
- Texto exacto enviado

Esto protege legalmente al colegio ante posibles reclamos del apoderado.

---

## 7. Reportes de asistencia requeridos

### 7.1 Reportes operativos (uso diario/semanal)

| Reporte | Frecuencia | Destinatario | Contenido |
|---|---|---|---|
| **Lista de asistencia del día** | Diario | Tutor | Lista de estudiantes con estado del día |
| **Resumen diario de sección** | Diario | Director | N° presentes, ausentes y tardanzas por sección |
| **Asistencia semanal** | Semanal | Tutor + Director | Tabla semanal por estudiante |
| **Estudiantes en alerta** | Diario / tiempo real | Director | Lista de estudiantes en nivel naranja o rojo |

### 7.2 Reportes periódicos (mensual/bimestral)

| Reporte | Frecuencia | Destinatario | Contenido |
|---|---|---|---|
| **Informe mensual de asistencia por sección** | Mensual | Director | Total días lectivos, % asistencia, faltas por tipo |
| **Informe mensual por estudiante** | Mensual | Tutor + Apoderado | Detalle día a día con estados y justificaciones |
| **Resumen por grado/nivel** | Mensual | Director | Comparativo de asistencia entre secciones |
| **Reporte de asistencia para libreta** | Por periodo | Tutor | Resumen del periodo para incluir en la libreta de notas |

### 7.3 Reportes oficiales para SIAGIE y UGEL

| Reporte | Cuándo | Formato |
|---|---|---|
| **Registro de asistencia SIAGIE** | Al cierre de cada mes | Carga en SIAGIE (manual o automatizada) |
| **Nómina de asistencia** | Al cierre del año | PDF firmado por director |
| **Reporte de estudiantes en riesgo** | Cuando el director lo solicita a UGEL | Excel o PDF |

---

## 8. Casos especiales de asistencia

### 8.1 Estudiante nuevo (matrícula tardía)

Cuando un estudiante se matricula después del inicio del año escolar, los días anteriores a su matrícula deben marcarse automáticamente como `NO APLICA` o `NM` (no matriculado) para que no afecten el cálculo del porcentaje de asistencia.

### 8.2 Estudiante retirado

Al registrar el retiro de un estudiante, el sistema debe:
- Cerrar el registro de asistencia desde la fecha de retiro
- Calcular el resumen final de asistencia hasta la fecha de retiro
- Generar automáticamente el reporte de asistencia parcial del año

### 8.3 Estudiante trasladado desde otra IE

El historial de asistencia previo (en la IE de origen) no se importa automáticamente. El sistema registra asistencia desde la fecha de matrícula en la IE actual. El registro del SIAGIE de la IE anterior queda en el historial oficial del estudiante.

### 8.4 Actividades extracurriculares y salidas de campo

Cuando toda una sección o el colegio realiza una actividad oficial fuera de las aulas (olimpiadas, visita de estudio, concurso):
- El director debe registrar la actividad como `ACTIVIDAD_OFICIAL` en el calendario
- Todos los estudiantes de las secciones participantes reciben estado `PRESENTE_ACTIVIDAD`
- Los estudiantes que no participen por motivo justificado reciben `FJ`
- Los que no participen sin justificación reciben `FI`

### 8.5 Clases virtuales / semipresenciales

Para IEs que combinen presencialidad con virtualidad (permitido en ciertos contextos), el sistema debe registrar por separado:
- Sesiones presenciales (`modalidad = PRESENCIAL`)
- Sesiones virtuales (`modalidad = VIRTUAL`)

El tipo de modalidad debe ser configurable por IE y puede variar dentro del año.

---

## 9. Asistencia en el SIAGIE: qué datos sincronizar

El SIAGIE registra asistencia a nivel mensual, no diario granular. Lo que se reporta al SIAGIE es:

| Campo SIAGIE | Cómo lo calcula el sistema |
|---|---|
| Días efectivos del mes | Días lectivos del calendario del mes |
| Días de asistencia | Días con estado `P`, `T` o `LM` |
| Días de inasistencia justificada | Días con estado `FJ` |
| Días de inasistencia injustificada | Días con estado `FI` |

> **Implicancia técnica:** El módulo de exportación al SIAGIE debe agregar los registros diarios en los totales mensuales requeridos por el sistema oficial. Ver Documento 4 — Integración SIAGIE para el formato exacto.

---

## 10. Modelo de datos conceptual de asistencia

```
CALENDARIO_ESCOLAR
  ├── anio_escolar_id
  ├── fecha          (DATE, PRIMARY KEY dentro del año)
  ├── tipo_dia       (LECTIVO | GESTION | FERIADO | VACACION | SUSPENSION | ACTIVIDAD)
  └── descripcion    (opcional, ej: "Día del Maestro")

ASISTENCIA_DIARIA
  ├── id
  ├── tenant_id
  ├── matricula_id        → FK a MATRICULA (estudiante × año escolar × sección)
  ├── fecha               → FK a CALENDARIO_ESCOLAR (solo días LECTIVOS)
  ├── estado              (P | T | FI | FJ | PS | LM | NM)
  ├── modalidad           (PRESENCIAL | VIRTUAL)
  ├── hora_llegada        (TIME, solo si estado = T)
  ├── registrado_por      → FK a USUARIO (docente tutor o auxiliar)
  ├── registrado_en       (TIMESTAMP)
  └── observacion         (TEXT, opcional)

JUSTIFICACION_INASISTENCIA
  ├── id
  ├── asistencia_id       → FK a ASISTENCIA_DIARIA
  ├── motivo_codigo       (ENF | FAM | MED | ACT | DUE | VIA | OTR)
  ├── descripcion         (TEXT)
  ├── documento_adjunto   (URL/path al archivo)
  ├── fecha_presentacion  (DATE)
  ├── aprobado_por        → FK a USUARIO (secretaría o director)
  ├── estado              (PENDIENTE | APROBADA | RECHAZADA)
  └── observacion         (TEXT)

ALERTA_ASISTENCIA
  ├── id
  ├── matricula_id        → FK a MATRICULA
  ├── tipo_alerta         (AUSENCIA_CONTINUA | PATRON_SEMANAL | ACUMULADO | INICIO_PERIODO)
  ├── nivel               (AMARILLO | NARANJA | ROJO)
  ├── fecha_generacion    (TIMESTAMP)
  ├── porcentaje_calculado (DECIMAL)
  ├── notificado_apoderado (BOOLEAN)
  ├── notificado_director  (BOOLEAN)
  └── atendida            (BOOLEAN)

NOTIFICACION_ASISTENCIA
  ├── id
  ├── alerta_id           → FK a ALERTA_ASISTENCIA (opcional)
  ├── matricula_id
  ├── canal               (PUSH | WHATSAPP | EMAIL | SMS | INTERNO)
  ├── plantilla_codigo    (ej: INASISTENCIA_DIARIA, ALERTA_ACUMULADO)
  ├── contenido_enviado   (TEXT)
  ├── enviado_en          (TIMESTAMP)
  └── estado_envio        (ENVIADO | FALLIDO | LEIDO)
```

---

## 11. Flujo completo de una inasistencia

```
Día lectivo
    │
    ▼
Docente tutor abre lista de asistencia
    │
    ▼
Marca estado por estudiante (P / T / FI)
    │
[Estado inicial = FI si no asiste]
    │
    ▼
Sistema envía notificación automática al apoderado
(WhatsApp/email/push) si el estado = FI
    │
    ▼
¿El apoderado presenta justificación dentro del plazo?
    │
  SÍ ──► Secretaría/Tutor revisa y aprueba
    │         │
    │       Aprobada ──► Estado cambia a FJ
    │       Rechazada ──► Estado permanece FI
    │
  NO ──► Al vencer el plazo, sistema confirma FI automáticamente
    │
    ▼
Sistema recalcula el porcentaje de inasistencias
    │
    ▼
¿Supera algún umbral de alerta?
    │
  SÍ ──► Genera ALERTA_ASISTENCIA con nivel correspondiente
    │         │
    │       Notifica a tutor y/o director
    │       Actualiza dashboard de riesgo
    │
  NO ──► Ninguna acción adicional
    │
    ▼
Al cierre del mes:
Agrega datos diarios → totales mensuales → listo para exportar a SIAGIE
```

---

## 12. Resumen de implicancias técnicas

| # | Implicancia | Tabla / Módulo |
|---|---|---|
| 1 | El registro de asistencia es **por día lectivo**, nunca en días no lectivos | `calendario_escolar` con tipo de día |
| 2 | Las faltas nacen como `FI` y pueden cambiar a `FJ` si se justifican en plazo | Lógica de estado con job automático al vencer el plazo |
| 3 | El plazo de justificación (5 días hábiles por norma) debe ser configurable por tenant | `tenant_config.dias_plazo_justificacion` |
| 4 | La conversión de tardanzas en falta debe ser configurable (default: 3 tardanzas = 1 falta) | `tenant_config.tardanzas_por_falta` |
| 5 | El porcentaje de inasistencia se calcula sobre días lectivos **transcurridos**, no total del año | Cálculo dinámico, no campo estático |
| 6 | Los umbrales de alerta (10%, 20%, 30%) deben ser configurables por tenant | `tenant_config.umbral_alerta_*` |
| 7 | Toda notificación enviada debe quedar auditada en el sistema | `notificacion_asistencia` |
| 8 | El módulo de exportación al SIAGIE agrega datos diarios en totales mensuales | Servicio `SiagieAsistenciaExporter` |
| 9 | Los estudiantes con matrícula tardía o retiro tienen días marcados como `NM` o cerrados | Lógica en `matricula.fecha_inicio` y `matricula.fecha_retiro` |
| 10 | Los días de actividades oficiales del colegio requieren estado especial para toda la sección | `PRESENTE_ACTIVIDAD` gestionado desde el calendario por el director |
| 11 | El sistema "Alerta Escuela" propio debe actualizarse en tiempo real, sin esperar al SIAGIE | Dashboard con cálculo en tiempo real |
| 12 | Las justificaciones deben soportar adjuntos (certificados médicos, declaraciones juradas) | Storage S3/R2 con referencia en `justificacion.documento_adjunto` |

---

## 13. Próximo documento

**Documento 4 — Integración con SIAGIE**  
Detalla la estrategia técnica para sincronizar datos con el sistema oficial del MINEDU: estructura de los archivos de exportación, flujo de doble registro, validación de DNI con RENIEC, automatización web con Playwright, y los datos mínimos requeridos para cada módulo (matrícula, asistencia, evaluación).

---

*Documento generado como parte de la serie de contexto técnico-legal para el sistema multitenant de gestión escolar EBR Perú.*  
*Mantener actualizado ante cambios en los lineamientos anuales de prestación del servicio educativo (RM de inicio de año escolar).*
