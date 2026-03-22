# Progreso de Sprints — SIGE Escolar
> Última actualización: 21 de marzo de 2026

Este documento compara el estado actual del proyecto contra el plan de sprints definido en `08_sprints_y_arranque.md`. Se marca cada tarea como ✅ completada, 🔶 parcial/incompleta o ❌ pendiente.

---

## SPRINT 0 — Fundación del proyecto ✅ COMPLETADO

### Backend
- ✅ Monorepo npm workspaces (`apps/api`, `apps/web`, `apps/admin`, `packages/types`, `packages/utils`)
- ✅ NestJS + Prisma configurado
- ✅ Vue 3 + Vite + TypeScript + Tailwind en web y admin
- ✅ Schema Prisma con modelo public (tenants, usuarios, ubigeos, áreas/competencias CNEB)
- ✅ Seed: ubigeos INEI (geodir CSVs en `/docs/`)
- ✅ Seed: áreas CNEB y competencias (29 competencias con orden oficial)
- ✅ Seed: superadmin inicial (`prisma/seed/superadmin.seed.ts`)
- ✅ `main.ts` configurado (helmet, cors, ValidationPipe, filtro global, `ResponseInterceptor`)
- ✅ `.env` y `.env.example`
- ✅ Script `scripts/create-tenant.ts` funcional
- 🔶 Seed `feriados_nacionales` — no confirmado (no encontrado en el código)

### Frontend
- ✅ Tailwind + paleta de colores
- ✅ Vue Router con guards de auth
- ✅ Pinia con persistencia
- ✅ Cliente Axios con interceptors (token refresh automático)
- ✅ Componentes `ui/` base: `BaseButton`, `BaseInput`, `BaseBadge`, `BaseTable`, `BaseModal`, `BaseSelect`, `BasePagination`, `BaseAlert`, `BaseSkeleton`
- ✅ Layout: Sidebar colapsable con iconos + tooltips
- ✅ Layout: Topbar con breadcrumb
- ✅ Login funcional en `apps/web` y `apps/admin`

---

## SPRINT 1 — Panel superadmin (apps/admin) ✅ COMPLETADO

### Backend (`apps/api/src/modules/admin/`)
- ✅ Módulo `admin/` con `SuperAdminGuard`
- ✅ `GET /api/v1/admin/tenants` — lista paginada
- ✅ `GET /api/v1/admin/tenants/:id` — detalle
- ✅ `POST /api/v1/admin/tenants` — crear colegio (wizard completo con transacción)
- ✅ `PATCH /api/v1/admin/tenants/:id` — editar colegio
- ✅ `PATCH /api/v1/admin/tenants/:id/status` — activar/dar de baja
- ✅ `GET /api/v1/admin/tenants/:id/stats`
- ✅ `GET /api/v1/admin/superadmins`
- ✅ `POST /api/v1/admin/superadmins`
- ✅ `DELETE /api/v1/admin/superadmins/:id` (con validación: no puede eliminarse a sí mismo)
- ✅ `GET /api/v1/admin/dashboard` — métricas globales
- ✅ Servicio de generación automática de periodos según régimen
- ✅ Servicio de seed por tenant (grados + áreas + competencias)
- 🔶 Envío de email al director con credenciales temporales — lógica existe en `tenants-admin.service.ts` pero la integración con Resend/SMTP no está confirmada como funcional

### Frontend (`apps/admin/src/views/`)
- ✅ `DashboardView` con StatCards
- ✅ `TenantsListView` — tabla paginada con búsqueda y filtros
- ✅ `TenantDetailView` — datos completos + estadísticas
- ✅ `TenantCreateView` — wizard de 5 pasos (datos básicos, MINEDU, director, año escolar, confirmación)
- ✅ `TenantEditView` — edición de datos del colegio
- ✅ `SuperAdminsView` — CRUD de superadmins
- ✅ Guard que redirige a `/login` si no es SUPER_ADMIN

---

## SPRINT 2 — Auth + configuración inicial (apps/web) ✅ COMPLETADO

### Backend (`apps/api/src/auth/`)
- ✅ `POST /api/v1/auth/login` — JWT access + refresh
- ✅ `POST /api/v1/auth/refresh` — rotar refresh token
- ✅ `POST /api/v1/auth/logout` — invalidar refresh token
- ✅ `GET /api/v1/auth/me` — datos del usuario actual
- ✅ `POST /api/v1/auth/change-password` — cambio de contraseña
- ✅ `GET /api/v1/config/anio-escolar` — configuración del año activo
- ✅ `GET /api/v1/config/periodos` — periodos del año activo
- ✅ `GET /api/v1/config/secciones` y `GET /api/v1/config/secciones/all`
- ✅ `POST /api/v1/config/secciones` — crear sección/aula
- ✅ `GET /api/v1/config/areas` — áreas con competencias
- 🔶 `GET /api/v1/config/calendario` — días lectivos del mes (no confirmado)
- 🔶 `PATCH /api/v1/config/tenant` — editar datos del colegio desde la vista web (no confirmado)

### Frontend
- ✅ `LoginView` — formulario con manejo de error 401
- ✅ `ChangePasswordView` — cambio forzado en primer login
- ✅ `DashboardView` — con StatCards y widgets funcionales
- ✅ `ConfiguracionView` — año escolar, periodos, régimen, secciones
- ✅ `AulasView` — gestión de secciones/aulas
- ✅ Topbar con nombre del colegio
- ✅ Sidebar por rol funcionando

---

## SPRINT 3 — Módulo de estudiantes y matrícula ✅ COMPLETADO

### Backend
- ✅ `GET /api/v1/estudiantes` — lista paginada (búsqueda nombre/DNI)
- ✅ `GET /api/v1/estudiantes/:id` — detalle
- ✅ `POST /api/v1/estudiantes` — registrar + validar RENIEC
- ✅ `PATCH /api/v1/estudiantes/:id` — actualizar datos
- ✅ `DELETE /api/v1/estudiantes/:id` — soft delete
- ✅ `GET /api/v1/estudiantes/validate-dni/:dni` — consultar RENIEC
- ✅ `GET /api/v1/matriculas` — lista paginada con filtros
- ✅ `GET /api/v1/matriculas/:id` — detalle
- ✅ `POST /api/v1/matriculas` — nueva matrícula
- ✅ `PATCH /api/v1/matriculas/:id` — editar matrícula
- ✅ `POST /api/v1/matriculas/:id/retirar` — registrar retiro
- ✅ `GET /api/v1/apoderados` — buscar por DNI
- ✅ `POST /api/v1/apoderados` — registrar apoderado
- ✅ `POST /api/v1/exoneraciones` — registrar exoneración Ed. Física / Religión
- ✅ `GET /api/v1/docentes` — módulo de docentes implementado

### Frontend
- ✅ `EstudiantesListView` — tabla paginada + búsqueda + filtros
- ✅ `EstudianteCreateView` — DniInput con autocompletado RENIEC
- ✅ `EstudianteDetailView` — datos + historial + apoderados + acciones
- ✅ `EstudianteEditView` — edición de datos complementarios
- ✅ `MatriculasListView` — filtro por sección
- ✅ `MatriculaCreateView` — nueva matrícula con sección y año
- ✅ `MatriculaDetailView` — detalle + retiro
- ✅ `ComponenteExoneracion` — form inline de exoneración
- ✅ `DocentesView` — CRUD de docentes

---

## SPRINT 4 — Módulo de asistencia ✅ COMPLETADO (con observaciones)

### Backend
- ✅ `GET /api/v1/asistencia/seccion/:seccionId/:fecha` — lista con estado del día
- ✅ `POST /api/v1/asistencia/seccion/:seccionId/:fecha` — registrar asistencia masiva
- 🔶 `PATCH /api/v1/asistencia/:id` — corrección individual (no confirmado como endpoint separado)
- ✅ `GET /api/v1/asistencia/historial/:matriculaId` — historial del estudiante
- ✅ `POST /api/v1/asistencia/justificaciones` — registrar justificación
- ✅ `PATCH /api/v1/asistencia/justificaciones/:id/revisar` — aprobar/rechazar
- ✅ `GET /api/v1/asistencia/alertas` — lista de alertas activas
- ✅ `POST /api/v1/asistencia/calcular-alertas` — recalcular alertas
- ✅ `GET /api/v1/asistencia/export/siagie` — Excel de asistencia para SIAGIE
- ✅ **Job** `AttendanceJob` — corre según schedule, recalcula porcentajes y genera alertas
- ❌ **Job** `JustificacionesJob` — no encontrado; las faltas vencidas no pasan a FI automáticamente
- ❌ `GET /api/v1/calendario/:anioId` — días lectivos del año (no implementado)
- ❌ `POST /api/v1/calendario/suspension` — registrar suspensión de clases (no implementado)

### Frontend
- ✅ `AsistenciaDiariaView` — selector sección + fecha, lista con estados P/T/FI, "Marcar todos presentes"
- ✅ `AlertasView` — tabla con semáforo, filtros, marcar como atendida
- ✅ `AsistenciaExportView` — selector mes/grado/sección, descarga Excel
- 🔶 `JustificacionesView` — existe una vista pero la aprobación/rechazo puede estar incompleta
- ❌ Mini-calendario en `AsistenciaDiariaView` (indicador de días ya registrados en el mes)
- ❌ "Marcar como enviado" en `AsistenciaExportView` → actualizar `siagie_sync_log`

---

## SPRINT 5 — Módulo de notas ✅ COMPLETADO (con observaciones)

### Backend
- ✅ `GET /api/v1/notas/grilla` — grilla de notas (seccionId, periodoId, areaId)
- ✅ `POST /api/v1/notas/grilla` — guardar lote con upsert
- ✅ `GET /api/v1/notas/estudiante/:matriculaId` — todas las notas del estudiante
- 🔶 `GET /api/v1/notas/periodo/:periodoId/estado` — % de notas completas (no confirmado)
- ✅ `GET /api/v1/notas/export/siagie` — Excel de calificaciones para SIAGIE
- ✅ `POST /api/v1/notas/cerrar-periodo` — cerrar periodo (DIRECTOR)
- ❌ `POST /api/v1/periodos/:id/reabrir` — reabrir periodo (no implementado)

### Frontend
- ✅ `NotasSeccionView` — grilla completa con selección período/área/sección, auto-guardado, CalificativoInput (AD/A/B/C + numérico 0-20), nav por teclado, indicador "Guardando..."
- ✅ `NotasExportView` — exportar Excel para SIAGIE por sección y período
- ❌ `NotasEstudianteView` — vista individual del estudiante con mapa de calificativos (no existe como vista separada)
- ❌ Widget de % de notas completas en Dashboard

---

## SPRINT 6 — Reportes y documentos PDF 🔶 PARCIALMENTE COMPLETADO

### Backend
- ✅ `GET /api/v1/reportes/libreta/:matriculaId/:periodoId` — datos de libreta (JSON)
- ✅ `GET /api/v1/reportes/libreta/:matriculaId/:periodoId/pdf` — PDF de libreta individual (Puppeteer + Handlebars/template)
- ✅ `GET /api/v1/reportes/rendimiento/seccion/:seccionId` — distribución de calificativos por área
- ❌ `GET /api/v1/reportes/libretas/:seccionId/:periodoId` — PDF lote de toda la sección
- ❌ `POST /api/v1/reportes/libretas/enviar` — enviar libretas por email/WhatsApp
- ❌ `GET /api/v1/reportes/acta-borrador/:seccionId` — PDF borrador del acta de cierre
- ❌ `GET /api/v1/reportes/nomina/:seccionId` — nómina de matriculados
- ❌ `GET /api/v1/reportes/asistencia-mensual/:seccionId/:mes` — reporte mensual de asistencia

### Frontend
- ✅ `ReportesView` — tabs: Libretas / Rendimiento Académico / Configuración PDF
- ✅ `LibretasTab` — selector período + sección, preview y descarga individual
- ✅ `RendimientoTab` — distribución de calificativos AD/A/B/C por área
- ✅ `ConfiguracionPDFTab` — subir logo y configurar apariencia de libretas
- ❌ Botón "Descargar PDF sección completa" (lote)
- ❌ Botón "Enviar a padres" (email/WhatsApp)
- ❌ Tabla de estado de entrega (enviado/leído/pendiente)
- ❌ Tab "Actas" en ReportesView — no existe

---

## SPRINT 7 — Cierre de año y panel SIAGIE ✅ COMPLETADO

### Backend
- ✅ `POST /api/v1/cierre/calcular/:anioEscolarId` — motor de promoción completo
- ✅ `GET /api/v1/cierre/resultado/:anioEscolarId` — resultados con filtro por sección
- ✅ `PATCH /api/v1/cierre/caso-especial/:matriculaId` — marcar caso especial + justificación
- ✅ `POST /api/v1/cierre/export/excel/:anioEscolarId` — Excel de cierre para SIAGIE
- ✅ `GET /api/v1/siagie/sync-log` — estado de sincronización de todos los módulos
- ✅ `PATCH /api/v1/siagie/sync-log/:id/confirmar` — confirmar envío al SIAGIE
- ✅ **Motor de promoción** `PromocionService`:
  - ✅ Promedio anual por competencia (AVG sobre todos los periodos regulares)
  - ✅ Grados estrictos 2° y 5° (umbral B/C en primaria, <14 en secundaria)
  - ✅ Exoneraciones excluidas del cálculo
  - ✅ Áreas de libre disponibilidad (`es_area_cneb = FALSE`) excluidas
  - ✅ Peso por competencia (promedio ponderado)
  - ✅ Almacena `promedios_areas` como JSONB en la BD
  - ❌ Detección de segunda repetición en el nivel (genera alerta especial)

### Frontend
- ✅ `CierreAnioView` — botón calcular con confirmación modal, tabla de resultados con situación + áreas en déficit, modal de caso especial con desglose de promedios, exportar Excel
- ✅ `SiagieView` — panel centralizado, tabla módulo/periodo/estado, generar Excel, confirmar envío
- ❌ `RecuperacionView` — lista de estudiantes en recuperación, ingreso de notas de recuperación, recálculo post-recuperación

---

## SPRINT 8 — Portal del apoderado y docente 🔶 PARCIALMENTE COMPLETADO

### Backend
- ✅ `GET /api/v1/portal/hijo` — datos del hijo del apoderado
- ✅ `GET /api/v1/portal/notas/:periodoId` — notas del hijo en el periodo
- ✅ `GET /api/v1/portal/asistencia` — resumen de asistencia del hijo
- ✅ `GET /api/v1/portal/libretas` — libretas disponibles para descargar
- ❌ `GET /api/v1/docente/mis-secciones` — secciones asignadas al docente
- ❌ `GET /api/v1/docente/mi-asistencia/:seccionId` — asistencia del día de su sección (docente accede a su sección)

### Frontend
- ✅ `PortalHijoView` — resumen del hijo: grado, sección, asistencia, calificativos
- ✅ `PortalLibretasView` — libretas disponibles para descargar
- ✅ `PortalNotasView` — notas del período actual
- ❌ Vistas del docente (rol `DOCENTE_AREA` / `DOCENTE_TUTOR`): mis secciones, acceso directo a grilla de notas y asistencia
- ❌ Redirección a `/forbidden` (en lugar de `/login`) para rutas sin permiso
- ❌ Página 403 con diseño institucional

---

## SPRINT 9 — Notificaciones y ajustes finales ❌ PENDIENTE

### Backend
- ❌ Integración WhatsApp Business API
- ❌ Integración Resend (email: libretas, alertas, credenciales) — solo el wizard de admin tiene un stub
- ❌ Job de notificaciones diarias de inasistencia (10am)
- ❌ Configuración de umbrales por tenant desde el panel del director
- ❌ `GET /api/v1/notificaciones` — historial de notificaciones
- ❌ Rate limiting en endpoints públicos (throttler)
- ❌ Logging estructurado con niveles

### Frontend
- ❌ Dashboard completo con todos los widgets (Doc 7 §6.2)
- ❌ `NotificacionesView` — historial de envíos
- ❌ `ConfiguracionUmbralesView` — sliders de umbrales + plazo de justificación + canales
- ❌ Páginas 404 y 403 con diseño institucional
- ❌ Loading global con skeleton en todas las vistas de lista (parcialmente presente)

---

## Resumen de estado

| Sprint | Módulo | Estado |
|--------|--------|--------|
| Sprint 0 | Fundación del proyecto | ✅ Completado |
| Sprint 1 | Panel superadmin (apps/admin) | ✅ Completado |
| Sprint 2 | Auth + configuración inicial | ✅ Completado |
| Sprint 3 | Estudiantes y matrícula | ✅ Completado |
| Sprint 4 | Asistencia | 🔶 ~85% — falta `JustificacionesJob` y módulo de calendario |
| Sprint 5 | Notas | 🔶 ~85% — falta `NotasEstudianteView` y reabrir período |
| Sprint 6 | Reportes y PDF | 🔶 ~50% — falta lote, envío y reportes de actas/nómina |
| Sprint 7 | Cierre de año + SIAGIE | ✅ Completado (falta `RecuperacionView`) |
| Sprint 8 | Portal apoderado y docente | 🔶 ~60% — portal apoderado completo, vistas de docente pendientes |
| Sprint 9 | Notificaciones y ajustes | ❌ Pendiente |

---

## Pendientes prioritarios (próximas tareas)

### Alta prioridad (bloquean funcionalidades del año escolar)
1. **`RecuperacionView`** — registro de notas de recuperación y recálculo de resultado post-recuperación
2. **`JustificacionesJob`** — marcar como FI automáticamente las justificaciones vencidas
3. **Reabrir período** — endpoint `POST /api/v1/periodos/:id/reabrir` + UI

### Media prioridad (mejoran la experiencia del director)
4. **Vistas del docente** — mis secciones, acceso directo a grilla y asistencia por rol `DOCENTE_TUTOR`
5. **PDF lote de libretas** — descarga de una sección completa en un solo PDF
6. **Tab "Actas" en ReportesView** — preview del acta de cierre + exportar para SIAGIE
7. **`NotasEstudianteView`** — mapa visual de calificativos de un estudiante

### Baja prioridad (mejoras de producto)
8. **Integración Resend (email)** — envío de libretas y alertas a apoderados
9. **WhatsApp Business API** — notificaciones diarias de inasistencia
10. **Módulo de calendario** — días lectivos y suspensiones de clases
11. **Configuración de umbrales** — por tenant desde el panel del director
12. **Detección segunda repetición en nivel** — alerta especial en el motor de promoción
13. **Páginas 403/404** con diseño institucional
