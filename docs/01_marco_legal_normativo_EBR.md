# Documento 1 — Marco Legal y Normativo
## Sistema de Gestión Escolar · Educación Básica Regular (EBR) · Perú

> **Serie:** Contexto Legal y Técnico para Sistema Multitenant de Gestión Escolar Peruana  
> **Documento:** 1 de 6  
> **Alcance:** Educación Básica Regular — Nivel Primaria y Secundaria  
> **Última revisión normativa:** Marzo 2026  

---

## 1. Jerarquía normativa aplicable

El sistema debe alinearse con la siguiente jerarquía de normas, ordenadas de mayor a menor rango:

### 1.1 Ley marco

| Norma | Descripción | Relevancia para el sistema |
|---|---|---|
| **Ley N° 28044** — Ley General de Educación | Define el sistema educativo peruano, sus modalidades, niveles y principios rectores | Base de toda la estructura pedagógica y administrativa |
| **D.S. N° 011-2012-ED** — Reglamento de la Ley General de Educación | Reglamenta la Ley 28044 | Define roles de IE, UGEL, DRE y MINEDU; obligaciones de directivos y docentes |

### 1.2 Normativa de gestión escolar

| Norma | Descripción | Módulos del sistema afectados |
|---|---|---|
| **R.M. N° 432-2020-MINEDU** | Norma que regula el registro de la trayectoria educativa del estudiante de Educación Básica a través del SIAGIE | Matrícula, asistencia, evaluación, documentos oficiales |
| **R.M. N° 452-2025-MINEDU** | Modifica la R.M. 432-2020 — incorpora responsabilidades de UGEL en módulo "Mi Certificado" del SIAGIE | Integración SIAGIE, certificados |
| **R.M. N° 447-2020-MINEDU** | Norma sobre el proceso de matrícula en la Educación Básica | Módulo de matrícula |
| **R.M. N° 048-2024-MINEDU** | Modifica la norma que regula la evaluación de las competencias de los estudiantes de Educación Básica | Módulo de evaluación y notas |
| **R.V.M. N° 094-2020-MINEDU** | Evaluación de los aprendizajes de los estudiantes en la Educación Básica | Escala de calificación, promoción, recuperación |

### 1.3 Normativa anual del año escolar

Cada año el MINEDU emite resoluciones que definen el calendario, las disposiciones específicas y los lineamientos para la gestión escolar. El sistema debe ser configurable para absorber estos cambios sin modificar código.

| Tipo de norma anual | Ejemplo reciente | Qué configura |
|---|---|---|
| R.M. de inicio de año escolar | R.M. 556-2024-MINEDU (año 2025) | Fechas de inicio/fin, semanas lectivas, semanas de gestión |
| Lineamientos de gestión escolar | Directiva anual MINEDU | Procesos de matrícula, vacantes, calendario de evaluaciones |
| Disposiciones de matrícula | Instructivo anual de matrícula | Tipos de proceso, plazos, documentos requeridos |

> **Implicancia técnica:** El sistema debe tener una tabla `anio_escolar_config` por tenant que almacene fechas, periodos lectivos y parámetros anuales, nunca hardcodeados en el código.

---

## 2. El SIAGIE como sistema oficial obligatorio

### 2.1 Definición y obligatoriedad

El **SIAGIE** (Sistema de Información de Apoyo a la Gestión de la Institución Educativa) es la plataforma web del Ministerio de Educación, disponible en `https://sistemas10.minedu.gob.pe/siagie3/`.

**Tiene carácter OBLIGATORIO** para todas las instituciones educativas públicas y privadas a nivel nacional, en todas las modalidades de Educación Básica.

### 2.2 Qué gestiona el SIAGIE

El SIAGIE es el sistema de registro oficial de la trayectoria educativa del estudiante. Gestiona:

- **Matrícula:** ingreso, continuidad y reincorporación de estudiantes
- **Asistencia:** registro diario por sección y docente
- **Evaluación:** notas por competencia, área, periodo y grado
- **Documentos oficiales:** generación de nóminas, actas y certificados con validez legal

### 2.3 Integraciones del SIAGIE con otros sistemas del Estado

El SIAGIE se conecta con:

| Sistema externo | Qué valida / extrae |
|---|---|
| **ESCALE** (Estadística de Calidad Educativa) | Padrón oficial de IEs activas. Solo IEs con estado "activo" en ESCALE pueden operar en SIAGIE |
| **RENIEC** | Validación de DNI de estudiantes: nombres, apellidos, fecha de nacimiento, género, UBIGEO de nacimiento, dirección |

> **Implicancia técnica:** Nuestro sistema debe validar DNI contra RENIEC en el momento de la matrícula. La estrategia recomendada es consumir el webservice de RENIEC directamente (disponible para entidades) o replicar la validación que hace el SIAGIE. Ver Documento 4 — Integración SIAGIE.

### 2.4 Responsabilidades definidas por normativa

La R.M. 432-2020 establece con claridad quién es responsable de cada registro:

| Actor | Responsabilidad |
|---|---|
| **Director / Directora de IE** | Registrar y emitir documentos oficiales en SIAGIE; único autorizado a firmar actas, certificados y nóminas |
| **Docente tutor / de aula** | Registrar asistencia diaria de su sección |
| **Docente de área** | Ingresar calificaciones por competencia |
| **Secretaría** | Apoyar proceso de matrícula; no puede registrar evaluaciones |
| **UGEL** | No puede modificar información sin consentimiento del director. A partir de R.M. 452-2025: valida solicitudes en módulo "Mi Certificado" en máximo 25 días hábiles |

> **Implicancia técnica:** Los roles del sistema deben reflejar exactamente esta estructura. El flujo de aprobación de documentos oficiales (actas, certificados) debe pasar siempre por el usuario con rol `director`.

---

## 3. Estructura de la Educación Básica Regular (EBR)

### 3.1 Niveles y grados

La EBR comprende tres niveles. El sistema en su versión inicial (v1) abarca **Primaria y Secundaria**:

| Nivel | Grados | Edad referencial | Ciclo MINEDU |
|---|---|---|---|
| Inicial | 0–5 años (cuna, jardín) | — | I y II |
| **Primaria** | 1° al 6° grado | 6–11 años | III, IV y V |
| **Secundaria** | 1° al 5° grado | 12–16 años | VI y VII |

### 3.2 Áreas curriculares por nivel

Las áreas curriculares son definidas por el **Currículo Nacional de Educación Básica (CNEB)**. Son estables entre años pero pueden sufrir ajustes por resolución ministerial.

**Primaria (1° a 6° grado) — áreas curriculares:**

| Área curricular | Observaciones |
|---|---|
| Comunicación | Incluye competencias de lectura, escritura y expresión oral |
| Matemática | |
| Personal Social | |
| Ciencia y Tecnología | |
| Arte y Cultura | |
| Educación Física | Posibilita exoneración por impedimento físico (todo el año) |
| Educación Religiosa | Posibilita exoneración (hasta 30 días desde inicio de clases) |
| Tutoría y Orientación Educativa | No se califica con escala literal; es de carácter formativo |

**Secundaria (1° a 5° grado) — áreas curriculares:**

| Área curricular | Observaciones |
|---|---|
| Comunicación | |
| Inglés | Segunda lengua |
| Matemática | |
| Ciencias Sociales | |
| Desarrollo Personal, Ciudadanía y Cívica (DPCC) | |
| Ciencia y Tecnología | |
| Educación para el Trabajo (EPT) | |
| Arte y Cultura | |
| Educación Física | Posibilita exoneración |
| Educación Religiosa | Posibilita exoneración |
| Tutoría y Orientación Educativa | No calificable con escala numérica |

> **Implicancia técnica:** Las áreas curriculares deben estar en una tabla `areas_curriculares` con flags como `permite_exoneracion` y `es_calificable`. No hardcodear. Los colegios privados pueden tener áreas adicionales (horas de libre disponibilidad) que también deben ser gestionables.

### 3.3 Regímenes de evaluación (periodicidad)

La normativa permite tres regímenes. Cada IE escoge uno al inicio del año escolar:

| Régimen | Periodos | Uso más común |
|---|---|---|
| **Bimestral** | 4 periodos (bimestres) | Colegios privados urbanos |
| **Trimestral** | 3 periodos (trimestres) | Mixto |
| **Semestral** | 2 periodos (semestres) | Menos frecuente en privados |

> **Implicancia técnica:** El régimen se configura por tenant (o por nivel dentro del tenant) en la tabla `tenant_regimen_config`. Toda la lógica de generación de libretas, actas y promedios finales debe respetar el régimen configurado.

---

## 4. Documentos oficiales que genera el sistema

Los siguientes documentos tienen validez legal y deben ser generados por el sistema en formato PDF, respetando las plantillas y campos definidos por MINEDU:

| Documento | Quién lo emite | Periodicidad | Firmado por |
|---|---|---|---|
| **Nómina de matrícula** | IE (a través de SIAGIE) | Inicio de año escolar | Director |
| **Registro auxiliar de evaluación** | Docente | Uso interno, por periodo | Docente |
| **Registro de asistencia** | Docente | Diario / mensual | Docente |
| **Libreta de notas (informe de progreso)** | IE | Por periodo (bimestre/trimestre/semestre) | Director y/o docente tutor |
| **Acta consolidada de evaluación** | IE (a través de SIAGIE) | Fin de año escolar | Director |
| **Certificado Oficial de Estudios** | IE (a través de SIAGIE) | A solicitud del estudiante | Director + UGEL (validación) |

> **Implicancia técnica:** El sistema debe generar estos documentos con la misma estructura de datos que usa SIAGIE, para que cuando el director los exporte al SIAGIE no haya discrepancias. Ver Documento 5 — Documentos Oficiales MINEDU.

---

## 5. Actores del sistema y sus roles normativos

### 5.1 Dentro de la Institución Educativa (IE)

| Actor | Rol en el sistema | Acciones que puede realizar |
|---|---|---|
| **Director** | `director` | Todo. Único que puede emitir documentos oficiales, aprobar matrícula, cerrar actas |
| **Subdirector** | `subdirector` | Gestión académica, supervisión docente; lo que le delegue el director |
| **Docente tutor** | `docente_tutor` | Asistencia de su sección, notas si también es docente de área, libreta de su sección |
| **Docente de área** | `docente_area` | Notas de sus áreas asignadas en las secciones que tiene a cargo |
| **Secretaría / Auxiliar** | `secretaria` | Matrícula, gestión de estudiantes, generación de reportes no oficiales |
| **Padre / madre / apoderado** | `apoderado` | Solo lectura: ver notas, asistencia y comunicados de su hijo/a |
| **Estudiante** | `estudiante` | Solo lectura: ver sus notas y asistencia (opcional, según configuración del colegio) |

### 5.2 Fuera de la IE (organismos del Estado)

| Actor externo | Relación con el sistema |
|---|---|
| **UGEL** | Supervisa. Valida certificados en SIAGIE. No modifica datos de la IE directamente |
| **DRE** | Dirección Regional de Educación. Supervisión regional |
| **MINEDU** | Emite normativa. Opera el SIAGIE central |

---

## 6. Calendario escolar y estructura del año

### 6.1 Hitos del año escolar (referencial — varía por resolución anual)

| Hito | Periodo referencial |
|---|---|
| Configuración SIAGIE / apertura de matrícula | Enero (desde el 6 de enero aprox.) |
| Semanas de gestión (inicio) | Primeras semanas de marzo |
| Inicio de clases | Segunda o tercera semana de marzo |
| Primer periodo lectivo | Marzo — Mayo |
| Vacaciones de medio año | Julio (2 semanas aprox.) |
| Segundo semestre | Agosto — Diciembre |
| Fin de clases | Tercera semana de diciembre |
| Programa de recuperación pedagógica | Diciembre — Febrero |

### 6.2 Semanas lectivas vs. semanas de gestión

El año escolar se divide en:

- **Semanas lectivas:** horas de clase efectiva con estudiantes. Meta mínima: 1,100 horas anuales (primaria) y 1,200 horas (secundaria).
- **Semanas de gestión:** jornadas de planificación, coordinación y capacitación docente sin estudiantes presentes. Hay bloques al inicio, entre periodos y al final del año.

> **Implicancia técnica:** El módulo de asistencia debe diferenciar días lectivos de días no lectivos (feriados, semanas de gestión, vacaciones). La tabla `calendario_escolar` debe registrar todos los días del año con su tipo.

---

## 7. Colegios privados: particularidades normativas

El sistema apunta principalmente a **instituciones educativas privadas**. Estas tienen las siguientes particularidades que el sistema debe soportar:

### 7.1 Autonomía curricular parcial

Los colegios privados pueden:
- Añadir **horas de libre disponibilidad** (áreas o talleres propios: computación, idiomas adicionales, etc.)
- Definir su propio nombre para áreas que no modifiquen el CNEB
- Tener secciones con nombres propios (en lugar de "A", "B", "C")

### 7.2 Escala de calificación interna vs. oficial

Algunos colegios privados manejan una escala numérica interna (ej. 0–20 en primaria) para comunicación con padres, aunque **la escala oficial registrada en SIAGIE es siempre la literal (AD/A/B/C)**. El sistema debe:
- Permitir configurar una escala interna por tenant (opcional)
- Siempre mapear a la escala oficial antes de exportar al SIAGIE

### 7.3 Pensiones y morosidad

La normativa peruana (Ley 27665 y modificatorias) **prohíbe a los colegios privados condicionar la entrega de libretas de notas o la matrícula al pago de pensiones**. El sistema no debe implementar ningún bloqueo de acceso a notas por deuda pendiente.

### 7.4 Número de estudiantes por aula

Para IEs privadas, el número máximo de estudiantes por aula depende de las condiciones bajo las cuales está autorizado el servicio educativo según la normativa vigente, y no de una cuota fija del MINEDU. El sistema debe permitir configurar el aforo máximo por sección.

---

## 8. Resumen de implicancias técnicas clave

| # | Implicancia | Tabla / Módulo afectado |
|---|---|---|
| 1 | Toda la configuración anual (fechas, periodos) debe ser parametrizable | `anio_escolar_config` |
| 2 | El régimen de evaluación (bimestral/trimestral/semestral) se configura por tenant/nivel | `tenant_regimen_config` |
| 3 | Las áreas curriculares no van hardcodeadas; incluyen flags de exoneración y calificabilidad | `areas_curriculares` |
| 4 | El rol `director` es el único que puede cerrar actas y emitir documentos oficiales | Sistema de roles y permisos |
| 5 | La escala de calificación varía por nivel: literal en primaria, numérica en secundaria | `configuracion_escala` |
| 6 | El sistema nunca bloquea notas/matrícula por deuda de pensiones | Módulo de pagos (futuro) |
| 7 | El calendario debe distinguir días lectivos, semanas de gestión, feriados y vacaciones | `calendario_escolar` |
| 8 | La exportación al SIAGIE siempre usa escala oficial (AD/A/B/C), nunca escala interna | Módulo de integración SIAGIE |
| 9 | Los datos de estudiantes deben validarse contra RENIEC (DNI, nombres, fecha de nacimiento) | Módulo de matrícula |
| 10 | Los colegios privados pueden tener áreas propias (libre disponibilidad) además del CNEB | `areas_curriculares` |

---

## 9. Referencias normativas

| Norma | Descripción corta | URL de referencia |
|---|---|---|
| Ley N° 28044 | Ley General de Educación | https://www.minedu.gob.pe/p/ley_general_de_educacion.pdf |
| R.M. N° 432-2020-MINEDU | Norma SIAGIE | https://www.gob.pe/minedu |
| R.M. N° 452-2025-MINEDU | Modifica norma SIAGIE | https://www.gob.pe/minedu |
| R.M. N° 048-2024-MINEDU | Norma de evaluación EBR | https://www.gob.pe/minedu |
| R.V.M. N° 094-2020-MINEDU | Evaluación de aprendizajes EBR | https://www.gob.pe/minedu |
| Currículo Nacional de EBR (CNEB) | Áreas, competencias, estándares | https://www.minedu.gob.pe/curriculo/ |
| Ley N° 27665 | Protección a la economía familiar (pensiones) | https://www.gob.pe |
| SIAGIE (plataforma) | Sistema oficial MINEDU | https://sistemas10.minedu.gob.pe/siagie3/ |

---

## 10. Próximo documento

**Documento 2 — Estructura Curricular y Sistema de Calificación**  
Detalla las competencias por área y grado, la escala AD/A/B/C (primaria), la escala numérica 0–20 (secundaria), las reglas exactas de promoción de grado, el programa de recuperación pedagógica y cómo se calculan los promedios finales.

---

*Documento generado como parte de la serie de contexto técnico-legal para el sistema multitenant de gestión escolar EBR Perú.*  
*Mantener actualizado ante cambios normativos anuales del MINEDU.*
