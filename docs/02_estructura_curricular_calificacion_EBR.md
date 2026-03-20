# Documento 2 — Estructura Curricular y Sistema de Calificación
## Sistema de Gestión Escolar · Educación Básica Regular (EBR) · Perú

> **Serie:** Contexto Legal y Técnico para Sistema Multitenant de Gestión Escolar Peruana  
> **Documento:** 2 de 6  
> **Alcance:** EBR — Nivel Primaria (1°–6°) y Secundaria (1°–5°)  
> **Norma base:** R.V.M. N° 094-2020-MINEDU · R.M. N° 048-2024-MINEDU · CNEB vigente  
> **Última revisión:** Marzo 2026  

---

## 1. Concepto central: la competencia como unidad de evaluación

En el sistema educativo peruano, la unidad mínima de evaluación **no es el área curricular** (el "curso") sino la **competencia** dentro de cada área. Este es el punto más importante del documento y el que más impacta el diseño del modelo de datos.

```
Área curricular  →  contiene una o más Competencias
Competencia      →  se califica con escala AD / A / B / C  (primaria)
                    o escala numérica 0–20               (secundaria)
Área curricular  →  su "nota final" es el resultado agregado de sus competencias
```

> **Implicancia técnica crítica:** La tabla de notas no es `(estudiante, area, periodo, nota)`. Es `(estudiante, competencia, periodo, nota)`. El promedio del área se deriva de las notas de sus competencias. El motor de promoción opera sobre competencias, no sobre áreas directamente.

---

## 2. Áreas curriculares y sus competencias — Primaria (1° a 6° grado)

El CNEB define **29 competencias en total** distribuidas en las áreas curriculares de primaria. A continuación se listan las áreas y el número de competencias calificables por área:

| # | Área curricular | N° de competencias | Competencias |
|---|---|---|---|
| 1 | **Comunicación** | 3 | Se comunica oralmente en su lengua materna · Lee diversos tipos de textos · Escribe diversos tipos de textos |
| 2 | **Matemática** | 4 | Resuelve problemas de cantidad · Resuelve problemas de regularidad, equivalencia y cambio · Resuelve problemas de movimiento, forma y localización · Resuelve problemas de gestión de datos e incertidumbre |
| 3 | **Personal Social** | 5 | Construye su identidad · Convive y participa democráticamente · Construye interpretaciones históricas · Gestiona responsablemente el espacio y el ambiente · Gestiona responsablemente los recursos económicos |
| 4 | **Ciencia y Tecnología** | 3 | Indaga mediante métodos científicos · Explica el mundo físico basándose en conocimientos · Diseña y construye soluciones tecnológicas |
| 5 | **Arte y Cultura** | 2 | Aprecia de manera crítica manifestaciones artístico-culturales · Crea proyectos desde los lenguajes artísticos |
| 6 | **Educación Física** | 3 | Se desenvuelve de manera autónoma a través de su motricidad · Asume una vida saludable · Interactúa a través de sus habilidades sociomotrices |
| 7 | **Educación Religiosa** | 2 | Construye su identidad como persona humana, amada por Dios · Asume la experiencia del encuentro personal y comunitario con Dios |
| 8 | **Tutoría y Orientación Educativa** | — | **No se califica con escala literal.** Es de acompañamiento; se registra participación y observaciones cualitativas |

> **Notas importantes:**
> - **Educación Física:** permite exoneración por impedimento físico (parcial o total), durante todo el año. El estudiante exonerado no recibe calificativo pero tampoco se cuenta esa competencia para fines de promoción.
> - **Educación Religiosa:** permite exoneración hasta 30 días después del inicio del año escolar. Mismo tratamiento que Ed. Física para fines de promoción.
> - **Inglés como lengua extranjera:** algunos colegios privados lo incluyen desde primaria como área adicional (horas de libre disponibilidad). Si se incluye, tiene sus propias competencias y se califica igual.

---

## 3. Áreas curriculares y sus competencias — Secundaria (1° a 5° grado)

| # | Área curricular | N° de competencias | Competencias |
|---|---|---|---|
| 1 | **Comunicación** | 3 | Se comunica oralmente en su lengua materna · Lee diversos tipos de textos · Escribe diversos tipos de textos |
| 2 | **Inglés** | 3 | Se comunica oralmente en inglés · Lee diversos tipos de textos en inglés · Escribe diversos tipos de textos en inglés |
| 3 | **Matemática** | 4 | Resuelve problemas de cantidad · Resuelve problemas de regularidad, equivalencia y cambio · Resuelve problemas de movimiento, forma y localización · Resuelve problemas de gestión de datos e incertidumbre |
| 4 | **Ciencias Sociales** | 3 | Construye interpretaciones históricas · Gestiona responsablemente el espacio y el ambiente · Gestiona responsablemente los recursos económicos |
| 5 | **Desarrollo Personal, Ciudadanía y Cívica (DPCC)** | 2 | Construye su identidad · Convive y participa democráticamente en la búsqueda del bien común |
| 6 | **Ciencia y Tecnología** | 3 | Indaga mediante métodos científicos · Explica el mundo físico basándose en conocimientos · Diseña y construye soluciones tecnológicas |
| 7 | **Educación para el Trabajo (EPT)** | 1 | Gestiona proyectos de emprendimiento económico o social |
| 8 | **Arte y Cultura** | 2 | Aprecia de manera crítica manifestaciones artístico-culturales · Crea proyectos desde los lenguajes artísticos |
| 9 | **Educación Física** | 3 | Se desenvuelve de manera autónoma a través de su motricidad · Asume una vida saludable · Interactúa a través de sus habilidades sociomotrices |
| 10 | **Educación Religiosa** | 2 | Construye su identidad como persona humana, amada por Dios · Asume la experiencia del encuentro personal y comunitario con Dios |
| 11 | **Tutoría y Orientación Educativa** | — | No se califica con escala numérica. Solo registro cualitativo |

> **Nota sobre DPCC:** La norma R.V.M. 094-2020 establece que los estudiantes de 1° a 4° de secundaria que no logren nivel satisfactorio en las **dos competencias de DPCC** deben recibir acompañamiento diferenciado en el siguiente periodo. Este es un caso especial a considerar en el motor de alertas.

---

## 4. Escala de calificación

### 4.1 Primaria — Escala literal y descriptiva

Aplica a todos los grados de primaria (1° a 6°) y a todas las competencias calificables.

| Calificativo | Nivel de logro | Descripción normativa |
|---|---|---|
| **AD** | Logro destacado | El estudiante evidencia un nivel **superior** al esperado respecto a la competencia. Demuestra aprendizajes que van más allá del nivel esperado para su grado. |
| **A** | Logro esperado | El estudiante evidencia el nivel **esperado** respecto a la competencia, demostrando manejo satisfactorio en todas las tareas propuestas y en el tiempo programado. |
| **B** | En proceso | El estudiante está **próximo o cerca** al nivel esperado. Requiere acompañamiento durante un tiempo razonable para lograrlo. |
| **C** | En inicio | El estudiante muestra un **progreso mínimo** en la competencia respecto al nivel esperado. Requiere mayor tiempo de acompañamiento e intervención del docente. |

**Orden jerárquico:** `AD > A > B > C`

**Representación interna recomendada en base de datos:**

```sql
-- Usar tipo ENUM o tabla de referencia. Nunca almacenar como string libre.
-- Para ordenamiento y comparación usar valor numérico equivalente:
AD = 4, A = 3, B = 2, C = 1
```

### 4.2 Secundaria — Escala numérica y descriptiva

Aplica a todos los grados de secundaria (1° a 5°). Las competencias se califican con nota numérica entera de **0 a 20**.

| Rango | Equivalencia literal | Descripción |
|---|---|---|
| **18 – 20** | AD | Logro destacado |
| **14 – 17** | A | Logro esperado |
| **11 – 13** | B | En proceso |
| **00 – 10** | C | En inicio |

> **Implicancia técnica:** Internamente el sistema puede almacenar la nota numérica y derivar el equivalente literal automáticamente. Para la exportación al SIAGIE de secundaria se usa la nota numérica. Para reportes comparativos entre niveles se usa el equivalente literal.

### 4.3 Casos especiales de calificación

| Caso | Código | Descripción |
|---|---|---|
| **Exonerado** | `EXO` | Estudiante con exoneración aprobada en Educación Física o Religiosa. No cuenta para fines de promoción. |
| **Sin calificativo** | `SC` o `—` | Periodo sin nota registrada (estudiante retirado a mitad del periodo, ingreso tardío, etc.) |
| **En trámite** | `ET` | Competencia pendiente de calificación (uso interno, no se exporta al SIAGIE) |
| **Retirado** | `RET` | Estudiante retirado del sistema durante el año escolar |

---

## 5. Cálculo del promedio de área

El área curricular no tiene una calificación directa en el CNEB; se **deriva** de sus competencias. Sin embargo, en la práctica los colegios y el SIAGIE calculan un promedio del área para efectos de reporte (libreta, actas). El método estándar es:

### 5.1 Primaria (conversión literal → numérico → promedio → literal)

```
Para calcular el promedio del área en primaria:
1. Convertir cada competencia a valor numérico: AD=4, A=3, B=2, C=1
2. Calcular promedio aritmético simple de las competencias del área
3. Reconvertir a escala literal:
   - Promedio ≥ 3.5  → AD
   - Promedio ≥ 2.5  → A
   - Promedio ≥ 1.5  → B
   - Promedio < 1.5  → C
```

> Este método es el más extendido en colegios privados. Algunos colegios aplican ponderación (competencias con distinto peso). El sistema debe soportar ambas variantes mediante configuración de `peso_competencia` por área, con valor default = 1 (peso igual).

### 5.2 Secundaria (promedio numérico directo)

```
Promedio del área = promedio aritmético de las notas numéricas de sus competencias
Resultado: número entero o decimal (redondeo al entero más cercano)
```

### 5.3 Promedio anual del área (multi-periodo)

Para áreas con régimen bimestral (4 bimestres), el promedio anual del área es:

```
Promedio anual = (Bim1 + Bim2 + Bim3 + Bim4) / 4
```

Para régimen trimestral (3 trimestres):

```
Promedio anual = (Trim1 + Trim2 + Trim3) / 3
```

Algunos colegios privados aplican **ponderación de periodos** (ej. último trimestre vale más). El sistema debe soportar el campo `peso_periodo` en la configuración del régimen.

---

## 6. Reglas de promoción, recuperación y permanencia

Normativa base: **R.V.M. N° 094-2020-MINEDU** y modificatoria **R.M. N° 048-2024-MINEDU**.

### 6.1 Grados exentos de repetición

| Grado | Regla |
|---|---|
| **Inicial (todos los niveles)** | No repiten. Promoción automática. |
| **1° de Primaria** | No repite. Promoción automática. |

Desde **2° de Primaria hasta 5° de Secundaria** aplican las reglas de promoción/permanencia descritas a continuación.

### 6.2 Primaria — Reglas de promoción (2° a 6° grado)

La unidad de análisis es la **competencia dentro de cada área**. Se evalúa cuántas competencias terminan el año con calificativo `C`.

**Condición de PROMOCIÓN directa** (sin recuperación):

```
El estudiante PROMUEVE si al término del año escolar:
  - Tiene C en MENOS DE LA MITAD de competencias en MENOS DE 4 áreas
```

**Condición de RECUPERACIÓN PEDAGÓGICA** (no repite inmediatamente):

```
El estudiante va a RECUPERACIÓN si:
  - Tiene C en la mitad o más de competencias en 1 a 3 áreas
  O
  - Tiene B en más de la mitad de competencias en áreas clave
```

**Condición de PERMANENCIA (repetición)**:

```
El estudiante REPITE si al término del año escolar (incluido el periodo de recuperación):
  - Tiene C en la mitad o más de competencias en 4 o más áreas
```

**Regla especial por grado en primaria** (R.V.M. 094-2020):

| Grado | Condición mínima para promover |
|---|---|
| 1°, 3° y 4° de primaria | Mínimo **B** en la mitad o más de las competencias. En el resto puede tener AD, A o **C** |
| 2° y 5° de primaria | Mínimo **A** o **AD** en la mitad o más de las competencias. **B** en las demás |
| 6° de primaria | Mínimo **B** en la mitad o más de competencias para continuar a secundaria |

> **Regla de una sola repetición:** En primaria y secundaria, un estudiante solo puede repetir **una vez** dentro del mismo nivel. La segunda repetición en el mismo nivel implica traslado obligatorio o situación especial con intervención de la UGEL.

### 6.3 Secundaria — Reglas de promoción (1° a 5° grado)

**Condición de PROMOCIÓN directa:**

```
El estudiante PROMUEVE si al término del año escolar:
  - Tiene C en la mitad o más de competencias en MENOS DE 4 áreas
  (puede ir con máximo 3 áreas con C para recuperación)
```

**Condición de RECUPERACIÓN PEDAGÓGICA:**

```
El estudiante va a RECUPERACIÓN si:
  - Tiene C en la mitad o más de competencias en 1, 2 o 3 áreas
```

**Condición de PERMANENCIA (repetición):**

```
El estudiante REPITE si:
  - Tiene C en la mitad o más de competencias en 4 o más áreas
  O
  - Después del programa de recuperación, no supera las áreas pendientes
```

**Regla especial por grado en secundaria** (R.V.M. 094-2020):

| Grado | Condición mínima para promover |
|---|---|
| 1°, 3° y 4° de secundaria | Mínimo **B** en la mitad o más de competencias |
| 2° y 5° de secundaria | Mínimo **A** o **AD** en la mitad o más de competencias; **B** en las demás |

### 6.4 Resumen del flujo de decisión al cierre del año

```
FIN DE AÑO ESCOLAR
        │
        ▼
¿Grado exento de repetición?
  (Inicial o 1° Primaria)
        │
  SÍ ──► PROMOVIDO automáticamente
        │
  NO    ▼
¿C en mitad o más de competencias
 en 4 o más áreas?
        │
  SÍ ──► PERMANECE en el grado (repite)
        │
  NO    ▼
¿C en 1 a 3 áreas?
        │
  SÍ ──► RECUPERACIÓN PEDAGÓGICA
        │         │
        │    Supera recuperación ──► PROMOVIDO
        │    No supera          ──► PERMANECE
        │
  NO    ▼
PROMOVIDO DIRECTO
```

---

## 7. Programa de recuperación pedagógica

### 7.1 Cuándo se activa

El programa de recuperación se activa cuando el estudiante termina el año con `C` en la mitad o más de competencias en **1 a 3 áreas** (umbral inferior a la repetición directa).

### 7.2 Cuándo y cómo se realiza

- **Durante el año:** El acompañamiento diferenciado debe darse a lo largo del año a estudiantes con C en periodos anteriores. No esperar al cierre.
- **En vacaciones de verano** (diciembre–febrero): El colegio organiza el programa. El estudiante puede realizarlo en otra IE con autorización del director.
- **Si el estudiante no asiste:** Debe prepararse de manera autónoma y rendir la evaluación de recuperación en las fechas que establezca la IE.

### 7.3 Resultado del programa de recuperación

| Resultado | Consecuencia |
|---|---|
| Supera las competencias pendientes | PROMOVIDO al siguiente grado |
| No supera (sigue con C en 4+ áreas) | PERMANECE (repite el grado) |
| No supera pero queda con C en menos de 4 áreas | Caso especial: IE decide con intervención de UGEL |

### 7.4 Implicancia en el sistema

El módulo de recuperación debe:
- Registrar qué estudiantes entran al programa (por área y competencias)
- Permitir al docente ingresar la nota de recuperación por competencia
- Recalcular automáticamente el estado de promoción post-recuperación
- Generar el listado de estudiantes en recuperación para el director

---

## 8. Periodos de evaluación y registro de notas

### 8.1 Régimen bimestral (4 periodos)

```
Bimestre 1:  marzo   – abril
Bimestre 2:  mayo    – julio
Bimestre 3:  agosto  – octubre
Bimestre 4:  octubre – diciembre
```

Al cierre de cada bimestre, el docente registra el calificativo (literal o numérico) de cada competencia para cada estudiante en su sección.

### 8.2 Régimen trimestral (3 periodos)

```
Trimestre 1:  marzo   – mayo
Trimestre 2:  junio   – agosto
Trimestre 3:  septiembre – diciembre
```

### 8.3 Régimen semestral (2 periodos)

```
Semestre 1:  marzo    – julio
Semestre 2:  agosto   – diciembre
```

### 8.4 Estados del registro de notas en el sistema

```
ABIERTO     → El periodo está vigente. El docente puede ingresar y modificar notas.
CERRADO     → El periodo terminó. El docente ya no puede modificar. Solo el director puede reabrir.
ENVIADO     → Las notas fueron exportadas al SIAGIE.
OBSERVADO   → El SIAGIE o el director encontró inconsistencias. Requiere corrección.
```

> **Regla importante:** Una vez que el director cierra un periodo, ningún docente puede modificar calificativos sin la aprobación explícita del director. Esto debe reflejarse en la lógica de permisos del sistema.

---

## 9. Conclusiones descriptivas

Además de los calificativos literales o numéricos, la R.V.M. 094-2020 exige que el docente registre **conclusiones descriptivas** por estudiante al cierre de cada periodo. Estas son textos cualitativos que explican el nivel de logro alcanzado, sus avances, dificultades y recomendaciones.

| Atributo | Detalle |
|---|---|
| Quién las redacta | El docente de cada área |
| Cuándo | Al cierre de cada periodo (bimestre/trimestre/semestre) |
| Dónde se muestran | En la libreta de notas entregada a la familia |
| Longitud recomendada | 2–4 oraciones por competencia o por área |
| ¿Son obligatorias? | Sí, según normativa. En la práctica muchos colegios las simplifican. |

> **Implicancia técnica:** La tabla de notas debe tener un campo `conclusion_descriptiva TEXT` por registro `(estudiante, competencia, periodo)`. Opcionalmente se puede ofrecer un generador asistido por IA como feature diferenciador del sistema.

---

## 10. Áreas de libre disponibilidad (colegios privados)

Los colegios privados pueden añadir **hasta 2 horas semanales de libre disponibilidad** en primaria y más en secundaria, creando áreas o talleres propios (ej. computación, robótica, francés, música, ajedrez).

Estas áreas:
- Se califican con la misma escala que el nivel (literal para primaria, numérica para secundaria)
- **No se consideran para las reglas de promoción de grado** (solo las áreas del CNEB cuentan)
- Deben figurar en la libreta interna del colegio
- Se reportan al SIAGIE solo si la IE las registró en su configuración curricular al inicio del año

> **Implicancia técnica:** La tabla `areas_curriculares` debe tener el flag `es_area_cneb BOOLEAN` (TRUE para áreas del currículo nacional, FALSE para áreas de libre disponibilidad). El motor de promoción solo opera sobre áreas con `es_area_cneb = TRUE`.

---

## 11. Resumen del modelo conceptual de calificación

```
TENANT (colegio)
  └── NIVEL (primaria | secundaria)
        └── GRADO (1° al 6° o 1° al 5°)
              └── SECCIÓN (A, B, C, ...)
                    └── ESTUDIANTE
                          └── MATRICULA (año escolar)
                                └── AREA_CURRICULAR
                                      └── COMPETENCIA
                                            └── NOTA_PERIODO
                                                  ├── periodo (bim1..4 | trim1..3 | sem1..2)
                                                  ├── calificativo (AD|A|B|C o 0-20)
                                                  ├── conclusion_descriptiva (TEXT)
                                                  └── estado (abierto|cerrado|enviado)
```

---

## 12. Resumen de implicancias técnicas

| # | Implicancia | Tabla / Módulo |
|---|---|---|
| 1 | La unidad de evaluación es la **competencia**, no el área | `competencias`, `notas_periodo` |
| 2 | Primaria usa escala literal (AD/A/B/C); secundaria usa escala numérica (0-20) | `configuracion_escala` por nivel |
| 3 | El promedio de área se **calcula**, no se ingresa directamente | Lógica de negocio, no columna directa |
| 4 | Pesos de competencias y de periodos deben ser configurables por tenant | `peso_competencia`, `peso_periodo` |
| 5 | Las áreas de libre disponibilidad no cuentan para promoción | Flag `es_area_cneb` en `areas_curriculares` |
| 6 | Ed. Física y Ed. Religiosa permiten exoneración; las competencias exoneradas no cuentan para promoción | Flag `exonerado` en `matricula_competencia` |
| 7 | El motor de promoción opera al cierre del año y al cierre del programa de recuperación | Servicio `PromocionService` |
| 8 | Las reglas de promoción varían por grado (2° vs 5° tienen condiciones más exigentes) | Tabla `reglas_promocion` parametrizable |
| 9 | El estado del registro de notas (abierto/cerrado/enviado) controla los permisos de edición | `estado_periodo` con lógica de permisos |
| 10 | Cada competencia requiere `conclusion_descriptiva` al cierre del periodo | Campo TEXT en `notas_periodo` |
| 11 | Un estudiante solo puede repetir una vez por nivel; la segunda vez activa alerta para UGEL | Flag `repeticiones_nivel` en `matricula` |
| 12 | Tutoría no se califica con escala estándar; solo registro cualitativo | Flag `es_calificable = FALSE` en el área |

---

## 13. Próximo documento

**Documento 3 — Gestión de Asistencia**  
Registro diario por sección, tipos de falta (justificada, injustificada, tardanza), umbrales de inasistencia que generan alertas y acciones, exoneraciones, y los reportes de asistencia que exige la normativa MINEDU.

---

*Documento generado como parte de la serie de contexto técnico-legal para el sistema multitenant de gestión escolar EBR Perú.*  
*Mantener actualizado ante cambios normativos anuales del MINEDU (R.V.M. 094-2020 y modificatorias).*
