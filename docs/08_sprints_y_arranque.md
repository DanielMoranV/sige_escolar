# Documento 8 — Plan de Sprints y Guía de Arranque
## Sistema de Gestión Escolar · EBR Perú · Monorepo NestJS + Vue 3

> **Serie:** Contexto Técnico para Sistema Multitenant de Gestión Escolar Peruana  
> **Documento:** 8 (complementario)  
> **Última revisión:** Marzo 2026  

---

## 1. Monorepo actualizado con app admin

```
sige-escolar/
│
├── apps/
│   ├── api/               ← Backend NestJS (único, sirve a web y admin)
│   ├── web/               ← Frontend colegios  → colegio.sige.edu.pe
│   └── admin/             ← Frontend superadmin → admin.sige.edu.pe
│
├── packages/
│   ├── types/             ← Tipos compartidos entre api, web y admin
│   └── utils/             ← Utilidades compartidas
│
├── prisma/                ← Schema + migraciones + seed
├── scripts/               ← create-tenant, migrate-all-tenants
├── .env
└── package.json           ← npm workspaces
```

### 1.1 Por qué una sola API para ambas apps

La API (`apps/api`) sirve tanto a `web` como a `admin`. La separación es solo de frontend. El router de NestJS distingue los contextos:

```
/api/v1/admin/*     ← Solo accesible con rol SUPER_ADMIN (guard global)
/api/v1/*           ← Endpoints de colegios (requieren tenant en el request)
```

El guard de superadmin bloquea a nivel de prefijo de ruta — ningún usuario de colegio puede tocar `/admin/*` aunque conozca la URL.

---

## 2. Estructura de apps/admin

```
apps/admin/
├── src/
│   ├── main.ts
│   ├── App.vue
│   ├── router/
│   │   ├── index.ts
│   │   └── routes/
│   │       ├── auth.routes.ts
│   │       ├── tenants.routes.ts
│   │       └── superadmins.routes.ts
│   ├── stores/
│   │   ├── auth.store.ts          ← Auth específico del panel admin
│   │   └── ui.store.ts
│   ├── api/
│   │   ├── client.ts              ← Axios apuntando a /api/v1/admin
│   │   └── services/
│   │       ├── tenants.service.ts
│   │       └── superadmins.service.ts
│   ├── layouts/
│   │   ├── AuthLayout.vue
│   │   └── AdminLayout.vue        ← Sidebar simplificado (pocos items)
│   ├── components/
│   │   ├── ui/                    ← Reutiliza los mismos componentes base
│   │   └── domain/
│   │       └── tenants/
│   │           ├── TenantCard.vue
│   │           ├── TenantStatusBadge.vue
│   │           └── TenantWizard.vue  ← Wizard de creación en pasos
│   └── views/
│       ├── auth/
│       │   └── LoginView.vue
│       ├── dashboard/
│       │   └── DashboardView.vue  ← Métricas globales del sistema
│       ├── tenants/
│       │   ├── TenantsListView.vue
│       │   ├── TenantDetailView.vue
│       │   └── TenantCreateView.vue  ← Wizard de 5 pasos
│       └── superadmins/
│           └── SuperAdminsView.vue   ← CRUD de usuarios SUPER_ADMIN
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 3. Módulos del backend para el panel admin

```
apps/api/src/modules/
├── admin/                            ← Módulo exclusivo del panel superadmin
│   ├── admin.module.ts
│   ├── tenants-admin/
│   │   ├── tenants-admin.controller.ts   ← Prefijo: /api/v1/admin/tenants
│   │   ├── tenants-admin.service.ts
│   │   └── dto/
│   │       ├── create-tenant.dto.ts
│   │       ├── update-tenant.dto.ts
│   │       └── tenant-config.dto.ts
│   └── superadmins/
│       ├── superadmins.controller.ts     ← Prefijo: /api/v1/admin/superadmins
│       ├── superadmins.service.ts
│       └── dto/
│           └── create-superadmin.dto.ts
```

---

## 4. Seeder de superadmin inicial

El primer superadmin se crea con un script que corre una sola vez al hacer el setup inicial. Desde el panel, el superadmin puede crear más.

```typescript
// prisma/seed/superadmin.seed.ts

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedSuperAdmin() {
  const existente = await prisma.usuario.findFirst({
    where: { rol: 'SUPER_ADMIN' },
  });

  if (existente) {
    console.log('✓ Superadmin ya existe — seed omitido');
    return;
  }

  const passwordHash = await bcrypt.hash(
    process.env.SEED_SUPERADMIN_PASSWORD ?? 'Cambiar1234!',
    12,
  );

  // El superadmin no pertenece a ningún tenant
  // tenant_id = NULL para SUPER_ADMIN
  await prisma.usuario.create({
    data: {
      email:         process.env.SEED_SUPERADMIN_EMAIL ?? 'admin@sige.edu.pe',
      password_hash: passwordHash,
      rol:           'SUPER_ADMIN',
      nombres:       'Super',
      apellidos:     'Admin',
      activo:        true,
      tenant_id:     null,   // Sin tenant
    },
  });

  console.log('✓ Superadmin inicial creado');
  console.log(`  Email:    ${process.env.SEED_SUPERADMIN_EMAIL ?? 'admin@sige.edu.pe'}`);
  console.log(`  Password: ${process.env.SEED_SUPERADMIN_PASSWORD ?? 'Cambiar1234!'}`);
  console.log('  ⚠️  Cambia la contraseña en el primer inicio de sesión');
}

seedSuperAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

```bash
# .env.example — variables del seed
SEED_SUPERADMIN_EMAIL="admin@sige.edu.pe"
SEED_SUPERADMIN_PASSWORD="Cambiar1234!"
```

---

## 5. Wizard de creación de colegio (5 pasos)

El flujo de alta de un colegio desde el panel admin sigue 5 pasos ordenados. El backend los procesa en una sola transacción al finalizar.

```
Paso 1 — Datos básicos del colegio
  ├── Nombre del colegio
  ├── Nombre corto (para el slug)
  ├── Plan: basico | profesional | enterprise
  └── Estado inicial: activo

Paso 2 — Datos MINEDU
  ├── Código modular (7 dígitos)
  ├── Anexo (default: 0)
  ├── Nombre oficial (exacto en ESCALE)
  ├── DRE (dropdown con opciones del Perú)
  ├── UGEL (dropdown filtrado por DRE)
  └── Tipo de gestión: PRIVADA | PÚBLICA | CONVENIO

Paso 3 — Director vigente
  ├── DNI del director (con validación RENIEC)
  ├── Nombres y apellidos (autocompleta desde RENIEC)
  └── Cargo: Director(a) | Sub Director(a)

Paso 4 — Año escolar y régimen
  ├── Año escolar activo (default: año actual)
  ├── Fecha de inicio de clases
  ├── Fecha de fin de clases
  ├── Régimen primaria: BIMESTRAL | TRIMESTRAL | SEMESTRAL
  └── Régimen secundaria: BIMESTRAL | TRIMESTRAL | SEMESTRAL

Paso 5 — Revisión y confirmación
  └── Resumen de todos los datos antes de crear
      → Botón "Crear colegio"
      → El backend ejecuta:
         1. Crear registro en public.tenants
         2. Crear schema PostgreSQL con el slug
         3. Aplicar migraciones al schema
         4. Cargar datos semilla (grados, áreas CNEB, competencias)
         5. Crear anio_escolar_config y regimen_config
         6. Crear periodos del año según el régimen
         7. Guardar tenant_datos_minedu
         8. Crear usuario DIRECTOR con credenciales temporales
         9. Enviar email al director con sus credenciales
```

### 5.1 Endpoint de creación de tenant (transacción completa)

```typescript
// tenants-admin.service.ts

async createTenant(dto: CreateTenantDto): Promise<TenantCreatedResponse> {
  // Todo en una sola transacción de Prisma
  return await this.prisma.$transaction(async (tx) => {

    // 1. Crear el tenant en public.tenants
    const slug = this.generateSlug(dto.nombreCorto);
    const tenant = await tx.tenant.create({
      data: {
        slug,
        nombre:      dto.nombre,
        nombreCorto: dto.nombreCorto,
        schemaName:  slug,
        plan:        dto.plan,
        activo:      true,
      },
    });

    // 2. Crear el schema de PostgreSQL
    await tx.$executeRawUnsafe(
      `CREATE SCHEMA IF NOT EXISTS "${slug}"`
    );

    // 3. Aplicar migraciones al nuevo schema
    await this.migrationsService.applyToSchema(slug);

    // 4. Obtener PrismaClient del nuevo tenant
    const tenantDb = await this.tenantPrisma.getClient(slug);

    // 5. Cargar semilla base (grados + áreas CNEB + competencias)
    await this.seedService.seedTenantBase(tenantDb);

    // 6. Configurar año escolar y régimen
    const anioConfig = await tenantDb.anio_escolar_config.create({
      data: {
        anio:          dto.anioEscolar,
        fecha_inicio:  new Date(dto.fechaInicio),
        fecha_fin:     new Date(dto.fechaFin),
        activo:        true,
      },
    });

    await tenantDb.regimen_config.createMany({
      data: [
        { anio_escolar_id: anioConfig.id, nivel: 'PRIMARIA',   tipo_regimen: dto.regimenPrimaria },
        { anio_escolar_id: anioConfig.id, nivel: 'SECUNDARIA', tipo_regimen: dto.regimenSecundaria },
      ],
    });

    // 7. Generar los periodos del año automáticamente
    await this.periodosService.generarPeriodos(tenantDb, anioConfig);

    // 8. Guardar datos MINEDU
    await tx.tenantDatosMinedu.create({
      data: {
        tenant_id:        tenant.id,
        codigo_modular:   dto.codigoModular,
        nombre_oficial:   dto.nombreOficial,
        dre_codigo:       dto.dreCodigo,
        dre_nombre:       dto.dreNombre,
        ugel_codigo:      dto.ugelCodigo,
        ugel_nombre:      dto.ugelNombre,
        tipo_gestion:     dto.tipoGestion,
        director_dni:     dto.directorDni,
        director_nombres: dto.directorNombres,
        director_apellidos: dto.directorApellidos,
      },
    });

    // 9. Crear usuario DIRECTOR con contraseña temporal
    const tempPassword = this.generateTempPassword();
    const hash = await bcrypt.hash(tempPassword, 12);

    const director = await tx.usuario.create({
      data: {
        tenant_id:     tenant.id,
        email:         dto.directorEmail,
        password_hash: hash,
        rol:           'DIRECTOR',
        nombres:       dto.directorNombres,
        apellidos:     dto.directorApellidos,
        activo:        true,
      },
    });

    // 10. Enviar email de bienvenida con credenciales
    await this.emailService.sendWelcome({
      to:           dto.directorEmail,
      nombre:       dto.directorNombres,
      colegio:      dto.nombre,
      email:        dto.directorEmail,
      password:     tempPassword,
      loginUrl:     `https://${slug}.sige.edu.pe`,
    });

    return {
      tenant,
      directorEmail: dto.directorEmail,
      loginUrl: `https://${slug}.sige.edu.pe`,
    };
  });
}
```

---

## 6. Plan de sprints

Cada sprint tiene: **objetivo claro**, **tareas de backend**, **tareas de frontend** y **criterio de terminado** (Definition of Done). Los sprints son modulares — no hay fechas fijas, cada uno se cierra cuando cumple su DoD.

Al iniciar cada sprint, el agente de código (Claude Code u otro) debe:
1. Leer los documentos de contexto relevantes (indicados en cada sprint)
2. Revisar las interfaces en `packages/types` antes de escribir código
3. Seguir las guías del Documento 7 (respuestas estándar, paginación, errores, componentes)

---

### SPRINT 0 — Fundación del proyecto
**Objetivo:** Monorepo funcionando, BD conectada, seed inicial ejecutado.  
**Documentos a leer antes:** Doc 7 (estructura), Doc 6 (schema sección 1 y 2)

#### Backend
```
☐ Inicializar monorepo npm workspaces
☐ Crear apps/api con NestJS + Prisma
☐ Crear apps/web con Vue 3 + Vite + TypeScript + Tailwind
☐ Crear apps/admin con Vue 3 + Vite + TypeScript + Tailwind
☐ Crear packages/types con interfaces base
☐ Crear packages/utils con formatters y validators peruanos
☐ Configurar schema.prisma con modelo public (tenants, usuarios, areas_cneb, competencias_cneb, ubigeos)
☐ Primera migración: crear tablas del schema public
☐ Seed: ubigeos INEI (tabla completa de departamentos, provincias, distritos)
☐ Seed: areas_cneb (8 primaria + 10 secundaria del CNEB)
☐ Seed: competencias_cneb (29 competencias con su orden oficial)
☐ Seed: feriados_nacionales año actual
☐ Seed: superadmin inicial
☐ Configurar main.ts (helmet, cors, ValidationPipe, filtro global, interceptor de respuesta)
☐ Configurar .env y .env.example
☐ Script scripts/create-tenant.ts funcional
```

#### Frontend (web + admin)
```
☐ Configurar Tailwind con la paleta de colores del Doc 7 (sección 5.1)
☐ Configurar Vue Router con guards de auth
☐ Configurar Pinia con persistencia básica
☐ Configurar TanStack Query
☐ Configurar cliente Axios con interceptors (Doc 7, sección 5.3)
☐ Componentes ui/ base: Button, Input, Badge, Table, Modal, Skeleton, Pagination, Alert
☐ Layout: Sidebar colapsable con iconos + tooltip (Doc 7, sección 5.2)
☐ Layout: Topbar con breadcrumb
☐ Login funcional en apps/web y apps/admin
```

**DoD Sprint 0:**
- `npm run dev` arranca api + web + admin sin errores
- Login devuelve JWT válido
- Seed ejecutado: superadmin creado, áreas y competencias CNEB cargadas
- Sidebar se colapsa/expande con animación, muestra tooltip en modo colapsado

---

### SPRINT 1 — Panel superadmin (apps/admin)
**Objetivo:** El superadmin puede gestionar colegios y otros superadmins desde el panel.  
**Documentos a leer antes:** Doc 6 (sección 2.1 y 2.2), Doc 8 (secciones 2, 3, 4, 5)

#### Backend
```
☐ Módulo admin/ con guard SuperAdminGuard
☐ GET    /api/v1/admin/tenants           → lista paginada de colegios
☐ GET    /api/v1/admin/tenants/:id       → detalle del colegio
☐ POST   /api/v1/admin/tenants           → crear colegio (wizard completo, sección 5.1)
☐ PATCH  /api/v1/admin/tenants/:id       → editar colegio (datos básicos + MINEDU + director)
☐ PATCH  /api/v1/admin/tenants/:id/status → activar / dar de baja
☐ GET    /api/v1/admin/tenants/:id/stats → estudiantes, usuarios, último acceso
☐ GET    /api/v1/admin/superadmins       → lista de superadmins
☐ POST   /api/v1/admin/superadmins       → crear superadmin
☐ DELETE /api/v1/admin/superadmins/:id   → eliminar superadmin
          (nunca puede eliminarse a sí mismo — validación en el servicio)
☐ GET    /api/v1/admin/dashboard         → métricas globales
          (total colegios activos/inactivos, total estudiantes, total usuarios)
☐ Servicio de generación automática de periodos según régimen
☐ Servicio de seed por tenant (grados + áreas + competencias)
```

#### Frontend (apps/admin)
```
☐ DashboardView: 4 StatCards (colegios activos, estudiantes, usuarios, último acceso)
☐ TenantsListView: tabla paginada con búsqueda, filtro por plan y estado
         columnas: nombre, código modular, plan, estado, estudiantes, acciones
☐ TenantDetailView: datos completos del colegio + estadísticas + historial
☐ TenantCreateView: wizard de 5 pasos (sección 5 de este documento)
         Paso 1: datos básicos con slug preview en tiempo real
         Paso 2: datos MINEDU con dropdown DRE → UGEL encadenado
         Paso 3: director con autocompletado RENIEC por DNI
         Paso 4: año escolar y régimen con preview de periodos generados
         Paso 5: resumen + confirmación
☐ TenantStatusToggle: modal de confirmación para dar de baja / reactivar
☐ SuperAdminsView: tabla + formulario inline de creación + confirmación de eliminación
☐ Guard: redirigir a /login si no es SUPER_ADMIN
```

**DoD Sprint 1:**
- Crear un colegio desde el wizard genera su schema, semilla, director y envía email
- Dar de baja un colegio bloquea el login de sus usuarios
- El superadmin puede crear y eliminar otros superadmins (nunca a sí mismo)
- El panel muestra estadísticas reales de la BD

---

### SPRINT 2 — Auth + configuración inicial del colegio (apps/web)
**Objetivo:** El director puede hacer login, ver su dashboard básico y configurar el año escolar.  
**Documentos a leer antes:** Doc 1 (sección 5), Doc 7 (sección 4.4), Doc 6 (sección 3)

#### Backend
```
☐ POST /api/v1/auth/login           → JWT access + refresh
☐ POST /api/v1/auth/refresh         → rotar refresh token
☐ POST /api/v1/auth/logout          → invalidar refresh token
☐ GET  /api/v1/auth/me              → datos del usuario actual
☐ POST /api/v1/auth/change-password → cambiar contraseña (obligatorio en primer login)
☐ GET  /api/v1/config/anio-escolar  → configuración del año activo
☐ GET  /api/v1/config/periodos      → periodos del año activo
☐ GET  /api/v1/config/calendario    → días lectivos del mes
☐ GET  /api/v1/config/regimen       → régimen de evaluación activo
☐ GET  /api/v1/config/areas         → áreas del colegio con sus competencias
☐ PATCH /api/v1/config/tenant       → editar datos del colegio (el director)
```

#### Frontend (apps/web)
```
☐ LoginView: formulario de login con manejo de error 401
☐ ChangePasswordView: forzar cambio en primer login (flag en el JWT)
☐ DashboardView: estructura base con 4 StatCards vacíos
         (se irán llenando en sprints siguientes)
☐ ConfiguracionView: vista de solo lectura con datos del año escolar
         muestra periodos, fechas, régimen — el director puede ver pero no editar
         (configuración inicial la hizo el superadmin)
☐ Topbar con nombre del colegio y logo
☐ Sidebar con menú completo según rol DIRECTOR (Doc 7 sección 5.2)
☐ Guard de roles funcionando en el router
```

**DoD Sprint 2:**
- El director hace login, es forzado a cambiar contraseña en el primer acceso
- El dashboard carga sin errores con datos reales
- El sidebar muestra las rutas correctas según el rol
- Los tokens se renuevan automáticamente sin que el usuario lo note

---

### SPRINT 3 — Módulo de estudiantes y matrícula
**Objetivo:** Registrar estudiantes con validación RENIEC y gestionar matrículas del año.  
**Documentos a leer antes:** Doc 1 (sección 5), Doc 4 (sección 3), Doc 6 (secciones 6.1 a 6.5)

#### Backend
```
☐ GET    /api/v1/estudiantes                    → lista paginada (buscar por nombre/DNI)
☐ GET    /api/v1/estudiantes/:id                → detalle del estudiante
☐ POST   /api/v1/estudiantes                    → registrar + validar RENIEC
☐ PATCH  /api/v1/estudiantes/:id                → actualizar datos
☐ DELETE /api/v1/estudiantes/:id                → soft delete
☐ GET    /api/v1/estudiantes/validate-dni/:dni  → consultar RENIEC
☐ GET    /api/v1/matriculas                     → lista paginada (filtros: grado, sección, estado)
☐ GET    /api/v1/matriculas/:id                 → detalle
☐ POST   /api/v1/matriculas                     → nueva matrícula
☐ PATCH  /api/v1/matriculas/:id                 → editar matrícula
☐ POST   /api/v1/matriculas/:id/retirar         → registrar retiro
☐ GET    /api/v1/apoderados                     → buscar apoderados existentes por DNI
☐ POST   /api/v1/apoderados                     → registrar apoderado
☐ POST   /api/v1/exoneraciones                  → registrar exoneración Ed. Física / Religión
```

#### Frontend (apps/web)
```
☐ EstudiantesListView:
    tabla paginada con búsqueda por nombre/DNI
    filtros: grado, sección, estado de matrícula
    columnas: nombre, DNI, grado, sección, estado, acciones
☐ EstudianteCreateView:
    DniInput con autocompletado RENIEC (spinner durante la consulta)
    Datos pre-llenados desde RENIEC (solo lectura)
    Campos editables: datos complementarios, apoderado, exoneraciones
☐ EstudianteDetailView:
    Datos personales + historial de matrículas + apoderados
    Acciones: editar, retirar
☐ MatriculasListView:
    Filtro por sección — útil para el director al inicio del año
☐ ComponenteExoneracion: form inline para agregar exoneración
☐ ComponenteApoderado: form de registro + búsqueda de existentes
```

**DoD Sprint 3:**
- Registrar un estudiante nuevo con DNI consulta RENIEC y pre-llena el formulario
- La matrícula queda vinculada a grado + sección + año escolar
- El retiro registra la fecha y motivo, el estudiante no aparece en las listas activas
- La búsqueda por nombre y DNI funciona con debounce

---

### SPRINT 4 — Módulo de asistencia
**Objetivo:** Los docentes registran asistencia diaria, el sistema genera alertas y el director exporta al SIAGIE.  
**Documentos a leer antes:** Doc 3 (completo), Doc 6 (sección 8)

#### Backend
```
☐ GET  /api/v1/asistencia/seccion/:seccionId/:fecha  → lista de estudiantes con estado del día
☐ POST /api/v1/asistencia/seccion/:seccionId/:fecha  → registrar asistencia masiva (array)
☐ PATCH /api/v1/asistencia/:id                       → corregir un registro individual
☐ GET  /api/v1/asistencia/estudiante/:matriculaId    → historial de asistencia del estudiante
☐ POST /api/v1/justificaciones                       → registrar justificación
☐ PATCH /api/v1/justificaciones/:id                  → aprobar / rechazar justificación
☐ GET  /api/v1/asistencia/alertas                    → lista de alertas activas (paginada)
☐ PATCH /api/v1/asistencia/alertas/:id/atender       → marcar alerta como atendida
☐ GET  /api/v1/asistencia/export/siagie              → generar Excel para SIAGIE
         query params: mes, grado, seccionId
         responde con el archivo Excel descargable
☐ Job: AlertasJob — corre cada noche, recalcula porcentajes y genera alertas
☐ Job: JustificacionesJob — marca como FI las que vencieron el plazo
☐ GET  /api/v1/calendario/:anioId                    → días lectivos del año
☐ POST /api/v1/calendario/suspension                 → registrar suspensión de clases
```

#### Frontend (apps/web)
```
☐ AsistenciaDiariaView:
    Selector de sección + fecha (default: hoy)
    Lista de estudiantes con selector de estado (P / T / FI)
    Opción "Marcar todos presentes" para agilizar
    Indicador de días ya registrados en el mes (mini-calendario)
    Guardar con un solo botón — toast de confirmación
☐ JustificacionesView:
    Lista de faltas pendientes de justificación con contador de días restantes
    Formulario de carga de justificación con adjunto
    Aprobar / rechazar con observación
☐ AlertasView:
    Tabla de estudiantes en riesgo con semáforo (verde/amarillo/naranja/rojo)
    Filtros por nivel de alerta y sección
    Marcar como atendida con observación
☐ AsistenciaExportView:
    Selector mes + grado + sección
    Preview de los totales antes de descargar
    Botón "Descargar Excel para SIAGIE"
    Botón "Marcar como enviado" → actualiza siagie_sync_log
☐ Widget en Dashboard: top 5 estudiantes con mayor riesgo
```

**DoD Sprint 4:**
- Registrar asistencia de una sección completa en menos de 30 segundos
- Las alertas se generan automáticamente al cruzar el umbral configurado
- Las faltas vencidas pasan a FI automáticamente por el job nocturno
- El Excel de asistencia generado es compatible con el formato SIAGIE

---

### SPRINT 5 — Módulo de notas
**Objetivo:** Los docentes registran calificativos y conclusiones descriptivas por competencia.  
**Documentos a leer antes:** Doc 2 (completo), Doc 6 (sección 7)

#### Backend
```
☐ GET  /api/v1/notas/grilla                     → grilla de notas de una sección
         query: seccionId, periodoId, areaId
         responde: estudiantes × competencias con sus calificativos actuales
☐ POST /api/v1/notas/grilla                     → guardar lote de calificativos
         body: array de { matriculaId, competenciaId, calificativo, conclusion }
         (guardado masivo con upsert para permitir re-edición)
☐ GET  /api/v1/notas/estudiante/:matriculaId    → todas las notas del estudiante
         (todos los periodos y áreas)
☐ GET  /api/v1/notas/periodo/:periodoId/estado  → % de notas completas por sección/área
         (para que el director monitoree el avance del registro)
☐ GET  /api/v1/periodos                         → periodos del año activo
☐ POST /api/v1/periodos/:id/cerrar              → cerrar periodo (solo DIRECTOR)
☐ POST /api/v1/periodos/:id/reabrir             → reabrir periodo (solo DIRECTOR)
☐ GET  /api/v1/notas/export/siagie              → Excel de calificaciones para SIAGIE
         query: seccionId, periodoId
         responde: archivo Excel con orden oficial de competencias
```

#### Frontend (apps/web)
```
☐ NotasSeccionView:
    Selector: periodo → área → sección
    GrillaNotas: tabla donde:
      - Filas = estudiantes (orden alfabético)
      - Columnas = competencias del área
      - Celdas = CalificativoInput (AD/A/B/C en primaria, 0-20 en secundaria)
    Navegación por teclado: Tab avanza a la siguiente celda
    Auto-guardado por fila al salir (no requiere botón)
    Indicador de guardado: "Guardando..." → "Guardado ✓"
    Columna de conclusión descriptiva: textarea expandible
☐ CalificativoInput: componente especializado
    Primaria: selector con 4 opciones visuales (AD/A/B/C con sus colores)
    Secundaria: input numérico 0-20 con validación inline
    EXO: checkbox si el estudiante está exonerado en esa área
☐ NotasEstudianteView:
    Vista individual del estudiante con todas sus notas
    Mapa visual de sus calificativos por área y periodo
☐ PeriodoStatusBadge: ACTIVO / CERRADO / EXPORTADO con colores
☐ NotasExportView:
    Selector sección + periodo
    Validación: muestra lista de notas faltantes antes de exportar
    Botón "Descargar Excel para SIAGIE"
☐ Widget en Dashboard: % de notas completas por periodo y sección
```

**DoD Sprint 5:**
- El docente puede registrar una grilla completa de notas con teclado (sin mouse)
- El auto-guardado funciona sin perder datos si el navegador se cierra
- El Excel de calificaciones generado tiene el orden de competencias correcto
- El director puede cerrar y reabrir periodos

---

### SPRINT 6 — Módulo de reportes y documentos PDF
**Objetivo:** El sistema genera libretas de notas en PDF personalizadas y reportes del director.  
**Documentos a leer antes:** Doc 5 (completo), Doc 7 (sección 4.6 PDF)

#### Backend
```
☐ GET  /api/v1/reportes/libreta/:matriculaId/:periodoId → PDF de libreta individual
☐ GET  /api/v1/reportes/libretas/:seccionId/:periodoId  → PDF lote de toda la sección
☐ POST /api/v1/reportes/libretas/enviar                 → enviar libretas por email / WhatsApp
         body: { seccionId, periodoId, canales: ['email', 'whatsapp'] }
☐ GET  /api/v1/reportes/acta-borrador/:seccionId        → PDF borrador del acta de cierre
☐ GET  /api/v1/reportes/nomina/:seccionId               → listado interno de matriculados
☐ GET  /api/v1/reportes/asistencia-mensual/:seccionId/:mes → reporte mensual de asistencia
☐ GET  /api/v1/reportes/rendimiento/:seccionId          → distribución AD/A/B/C por área
☐ Servicio PDF con Puppeteer (pool de instancias para performance)
☐ Plantillas Blade equivalentes en NestJS (usar Handlebars o Nunjucks + Puppeteer)
```

#### Frontend (apps/web)
```
☐ ReportesView:
    Tabs: Libretas / Actas / Asistencia / Rendimiento
☐ LibretasTab:
    Selector: periodo + sección
    Preview de libreta individual en iframe
    Botón "Descargar PDF sección completa"
    Botón "Enviar a padres" (selector de canal: email / WhatsApp)
    Tabla de estado de entrega (enviado / leído / pendiente)
☐ ActasTab:
    Botón "Ver borrador de acta" — abre PDF preview
    Resumen de promovidos / permanecen / recuperación
    Exportar Excel para SIAGIE
☐ ConfiguracionPDFView (dentro de Configuración):
    Subir logo del colegio
    Seleccionar colores institucionales
    Preview en tiempo real de la libreta con los cambios
```

**DoD Sprint 6:**
- La libreta se genera en PDF con el logo y colores del colegio
- El envío masivo por email funciona para una sección completa
- El borrador del acta muestra los mismos datos que generaría el SIAGIE
- El director puede ver el % de libretas leídas por los apoderados

---

### SPRINT 7 — Cierre de año y panel SIAGIE
**Objetivo:** Motor de promoción, cierre anual y panel centralizado de sincronización SIAGIE.  
**Documentos a leer antes:** Doc 2 (sección 6 y 7), Doc 4 (sección 2), Doc 6 (sección 7.3 y 9.1)

#### Backend
```
☐ POST /api/v1/cierre/calcular/:anioEscolarId   → ejecutar motor de promoción
         calcula resultado de todos los estudiantes y devuelve resumen
☐ GET  /api/v1/cierre/resultado/:anioEscolarId  → resultado del cierre por sección
☐ PATCH /api/v1/cierre/caso-especial/:matriculaId → marcar caso especial + justificación
☐ POST /api/v1/cierre/export/excel/:anioEscolarId → Excel de cierre para SIAGIE
☐ GET  /api/v1/siagie/sync-log                  → estado de sincronización de todos los módulos
☐ PATCH /api/v1/siagie/sync-log/:id/confirmar   → el director confirma que subió al SIAGIE
☐ Motor de promoción PromocionService (Doc 2, sección 6):
    Aplica reglas por grado (2°/5° más exigentes)
    Considera exoneraciones en el conteo de competencias
    Excluye áreas de libre disponibilidad del cálculo
    Detecta segunda repetición en el nivel (genera alerta especial)
```

#### Frontend (apps/web)
```
☐ CierreAnioView:
    Botón "Calcular cierre" (con confirmación)
    Tabla de resultados: estudiante / resultado / áreas en C / decisión
    Editar casos especiales con justificación
    Vista resumen: N promovidos / N permanecen / N en recuperación
    Exportar Excel para SIAGIE
☐ SiagieView (panel centralizado):
    Dashboard de sincronización (widget ya visto en el dashboard principal)
    Tabla completa: módulo / periodo / estado / fecha / acciones
    Por cada fila pendiente: botón "Generar Excel" → descarga directo
    Por cada fila exportada: botón "Confirmar envío al SIAGIE"
    Filtros: por módulo, por estado, por periodo
☐ RecuperacionView:
    Lista de estudiantes en programa de recuperación
    Por estudiante: qué áreas y competencias tiene pendientes
    Formulario de ingreso de notas de recuperación
    Recalculo automático del resultado post-recuperación
```

**DoD Sprint 7:**
- El motor de promoción genera resultados correctos según las reglas del Doc 2
- Los casos especiales quedan registrados con justificación auditable
- El panel SIAGIE centraliza todos los pendientes de sincronización
- El Excel de cierre se puede subir directamente al SIAGIE sin ajustes manuales

---

### SPRINT 8 — Portal del apoderado y docente
**Objetivo:** Los padres y docentes acceden a sus vistas restringidas.  
**Documentos a leer antes:** Doc 7 (sección 5.2 menu config)

#### Backend
```
☐ GET /api/v1/portal/hijo                       → datos del hijo del apoderado actual
☐ GET /api/v1/portal/notas/:periodoId           → notas del hijo en el periodo
☐ GET /api/v1/portal/asistencia                 → resumen de asistencia del hijo
☐ GET /api/v1/portal/libretas                   → libretas disponibles para descargar
☐ GET /api/v1/docente/mis-secciones             → secciones asignadas al docente
☐ GET /api/v1/docente/mi-asistencia/:seccionId  → asistencia del día de su sección
```

#### Frontend (apps/web — vistas adicionales por rol)
```
☐ Vistas del apoderado (rol APODERADO):
    Resumen del hijo: foto, grado, sección, tutor
    Notas del periodo actual con CalificativoBadge
    Asistencia del mes con mini-calendario
    Libretas disponibles para descargar
☐ Vistas del docente (rol DOCENTE_AREA / DOCENTE_TUTOR):
    Mis secciones: lista de secciones asignadas
    Acceso directo a grilla de notas de sus áreas
    Acceso directo a registro de asistencia de su sección
    Las rutas fuera de sus permisos muestran 403 con mensaje claro
☐ Guard de roles refinado:
    Cada vista verifica el rol exacto requerido
    Redirige a /forbidden si no tiene permiso (no a /login)
```

**DoD Sprint 8:**
- El apoderado ve solo la información de sus hijos
- El docente solo puede editar notas de sus áreas asignadas
- Un docente no puede ver ni modificar notas de otro docente
- El portal del apoderado carga en menos de 2 segundos

---

### SPRINT 9 — Notificaciones y ajustes finales
**Objetivo:** Notificaciones automáticas funcionando, dashboard completo, pulido general.

#### Backend
```
☐ Integración WhatsApp Business API (notificaciones de asistencia)
☐ Integración Resend (email: libretas, alertas, credenciales)
☐ Job de notificaciones diarias de inasistencia (corre a las 10am)
☐ Configuración de umbrales por tenant desde el panel del director
☐ GET /api/v1/notificaciones → historial de notificaciones enviadas
☐ Rate limiting en endpoints públicos (throttler)
☐ Logging estructurado con niveles (info, warn, error)
```

#### Frontend (apps/web)
```
☐ Dashboard completo con todos los widgets (Doc 7 sección 6.2)
☐ NotificacionesView: historial de envíos con estado entregado/fallido
☐ ConfiguracionUmbralesView:
    Slider de umbrales de alerta (10%, 20%, 30% — editables)
    Configurar plazo de justificación (default: 5 días hábiles)
    Activar/desactivar canales de notificación
☐ Página 404 y 403 con diseño institucional
☐ Loading global con skeleton en todas las vistas de lista
☐ Modo oscuro (bonus — si hay tiempo)
```

**DoD Sprint 9:**
- Los padres reciben WhatsApp cuando su hijo falta
- El dashboard muestra datos reales de todos los módulos
- Los umbrales de alerta son configurables por colegio
- No hay rutas sin manejo de error

---

## 7. Orden de los documentos de contexto por sprint

Esta tabla es la referencia rápida para saber qué documentos leer antes de cada sprint:

| Sprint | Documentos obligatorios | Secciones clave |
|---|---|---|
| Sprint 0 | Doc 7, Doc 6 §1-2 | Estructura monorepo, schema public |
| Sprint 1 | Doc 6 §2.1-2.2, Doc 8 §2-5 | Tablas public, wizard de tenant |
| Sprint 2 | Doc 1 §5, Doc 7 §4.4, Doc 6 §3 | Roles, seguridad, config año escolar |
| Sprint 3 | Doc 1 §5, Doc 4 §3, Doc 6 §6 | Matrícula, RENIEC, estudiantes |
| Sprint 4 | Doc 3 completo, Doc 6 §8 | Asistencia, alertas, export |
| Sprint 5 | Doc 2 completo, Doc 6 §7 | Notas, calificativos, promoción |
| Sprint 6 | Doc 5 completo, Doc 7 §4.6 | Documentos PDF, libretas |
| Sprint 7 | Doc 2 §6-7, Doc 4 §2, Doc 6 §7.3-9.1 | Cierre, motor promoción, SIAGIE |
| Sprint 8 | Doc 7 §5.2 | Roles, permisos por vista |
| Sprint 9 | Doc 3 §6, Doc 7 §5.6 | Notificaciones, umbrales, toasts |

---

## 8. Instrucción para Claude Code al iniciar cada sprint

Al comenzar a trabajar en cualquier sprint, incluir este bloque en el prompt inicial:

```
Antes de escribir cualquier línea de código:
1. Lee el Documento [N] completo, secciones [X, Y, Z]
2. Revisa las interfaces en packages/types/ para los modelos involucrados
3. Verifica que el schema.prisma tiene las tablas requeridas por este sprint
4. Sigue las convenciones del Documento 7:
   - Backend: respuesta estándar ApiResponse<T>, PaginationDto, GlobalExceptionFilter
   - Frontend: useTableQuery para listas, services en api/services/, stores solo para estado global
5. No hardcodees ningún valor que esté en .env o en tablas de configuración
```

---

*Documento generado como parte de la serie de contexto técnico para el sistema multitenant de gestión escolar EBR Perú.*
