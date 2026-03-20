# SIGE Escolar

Sistema de Gestión Escolar SaaS multitenant para instituciones educativas peruanas de Educación Básica Regular (EBR). Permite gestionar matrícula, asistencia, evaluaciones por competencia y sincronización con el SIAGIE (sistema oficial del MINEDU).

## Stack

| Capa | Tecnología |
|---|---|
| Backend | NestJS + TypeScript |
| Base de datos | PostgreSQL 16 (schema por tenant) |
| ORM | Prisma |
| Frontend colegios | Vue 3 + Vite + Tailwind |
| Frontend superadmin | Vue 3 + Vite + Tailwind |
| Estado | Pinia + TanStack Query |
| Jobs asíncronos | BullMQ + Redis |
| Infraestructura local | Docker Compose |

## Estructura del monorepo

```
sige-escolar/
├── apps/
│   ├── api/          ← Backend NestJS  (puerto 3000)
│   ├── web/          ← Frontend colegios (puerto 5173)
│   └── admin/        ← Frontend superadmin (puerto 5174)
├── packages/
│   ├── types/        ← Tipos TypeScript compartidos
│   └── utils/        ← Formateadores y validadores (DNI, UBIGEO, calificativos)
├── prisma/
│   ├── schema.prisma
│   └── seed/         ← Áreas CNEB, competencias, feriados, superadmin
├── scripts/
│   └── create-tenant.ts
└── docker-compose.yml
```

---

## Requisitos previos

- **Node.js** v20+
- **npm** v10+
- **Docker** y **Docker Compose**

---

## Configuración inicial

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd sige-escolar
```

### 2. Variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus valores. Los campos obligatorios para desarrollo son:

```bash
DATABASE_URL="postgresql://sige:sige@127.0.0.1:5436/sige_escolar?schema=public"
JWT_SECRET="un-secreto-seguro-minimo-32-caracteres"
JWT_REFRESH_SECRET="otro-secreto-diferente-minimo-32-chars"
SEED_SUPERADMIN_EMAIL="admin@tucolegio.pe"
SEED_SUPERADMIN_PASSWORD="TuPassword123!"
```

### 3. Levantar la infraestructura (BD + Redis)

```bash
docker compose up -d
```

Esto levanta:
- `sige-postgres` → PostgreSQL 16 en puerto **5436**
- `sige-redis` → Redis 7 en puerto **6380**

### 4. Instalar dependencias

```bash
npm install
```

### 5. Crear las tablas y cargar datos iniciales

```bash
# Crear tablas
npm run db:migrate

# Cargar áreas CNEB, competencias, feriados y superadmin
npm run db:seed
```

### 6. Levantar el proyecto en desarrollo

```bash
# Opción A — Todo junto
npm run dev

# Opción B — Por separado (recomendado para ver logs)
npm run dev:api      # API en http://localhost:3000
npm run dev:web      # Frontend colegios en http://localhost:5173
npm run dev:admin    # Panel admin en http://localhost:5174
```

### 7. Primer acceso

Abre `http://localhost:5174` (panel superadmin) e inicia sesión con las credenciales definidas en `SEED_SUPERADMIN_EMAIL` y `SEED_SUPERADMIN_PASSWORD`.

---

## Comandos útiles

```bash
# Base de datos
npm run db:migrate       # Aplicar migraciones pendientes
npm run db:seed          # Re-ejecutar seeds (idempotente)
npm run db:studio        # Abrir Prisma Studio en el navegador

# Docker
docker compose up -d     # Levantar contenedores
docker compose down      # Detener contenedores (datos se conservan)
docker compose down -v   # Detener y borrar volúmenes (borra la BD)
docker compose logs -f   # Ver logs en tiempo real

# Crear un nuevo colegio (tenant)
npm run tenant:create

# Linting y formato
npm run lint
npm run format
```

---

## Variables de entorno — referencia completa

| Variable | Descripción | Requerida |
|---|---|---|
| `DATABASE_URL` | Cadena de conexión PostgreSQL | Sí |
| `JWT_SECRET` | Secreto para firmar access tokens (mín. 32 chars) | Sí |
| `JWT_REFRESH_SECRET` | Secreto para refresh tokens (diferente al anterior) | Sí |
| `PORT` | Puerto de la API (default: 3000) | No |
| `FRONTEND_URL` | URL del frontend para CORS (default: http://localhost:5173) | No |
| `NODE_ENV` | Entorno: development / production | No |
| `SEED_SUPERADMIN_EMAIL` | Email del superadmin inicial | Solo seed |
| `SEED_SUPERADMIN_PASSWORD` | Contraseña del superadmin inicial | Solo seed |
| `REDIS_HOST` | Host de Redis | No |
| `REDIS_PORT` | Puerto de Redis (default: 6380) | No |
| `RENIEC_API_URL` | URL del proveedor de API RENIEC | Sprint 3+ |
| `RENIEC_API_KEY` | Clave del proveedor de API RENIEC | Sprint 3+ |
| `RESEND_API_KEY` | API key de Resend para emails | Sprint 9 |
| `EMAIL_FROM` | Dirección de correo remitente | Sprint 9 |
| `WHATSAPP_API_URL` | URL de WhatsApp Business API | Sprint 9 |
| `WHATSAPP_TOKEN` | Token de WhatsApp Business API | Sprint 9 |
| `R2_ACCOUNT_ID` | Cloudflare R2: Account ID | Sprint 6+ |
| `R2_ACCESS_KEY` | Cloudflare R2: Access Key | Sprint 6+ |
| `R2_SECRET_KEY` | Cloudflare R2: Secret Key | Sprint 6+ |
| `R2_BUCKET` | Cloudflare R2: nombre del bucket | Sprint 6+ |
| `R2_PUBLIC_URL` | Cloudflare R2: URL pública del bucket | Sprint 6+ |

---

## Arquitectura multitenant

Cada colegio tiene su propio **schema de PostgreSQL**. El schema `public` contiene las tablas compartidas (tenants, usuarios, áreas CNEB, competencias). Cuando se crea un nuevo colegio se provisiona automáticamente su schema con las tablas y datos base.

```
PostgreSQL
├── schema: public          ← Compartido (tenants, usuarios, áreas CNEB)
├── schema: colegio_abc     ← Datos de "Colegio ABC"
├── schema: san_jose        ← Datos de "Colegio San José"
└── schema: ...
```

---

## Módulos planificados (Sprints)

| Sprint | Módulo | Estado |
|---|---|---|
| Sprint 0 | Fundación: monorepo, BD, auth, sidebar | ✅ Completado |
| Sprint 1 | Panel superadmin: CRUD de colegios | ⬜ Pendiente |
| Sprint 2 | Auth completa + configuración del colegio | ⬜ Pendiente |
| Sprint 3 | Matrícula + validación RENIEC | ⬜ Pendiente |
| Sprint 4 | Asistencia diaria + alertas de riesgo | ⬜ Pendiente |
| Sprint 5 | Registro de notas por competencia | ⬜ Pendiente |
| Sprint 6 | Libretas de notas en PDF personalizadas | ⬜ Pendiente |
| Sprint 7 | Cierre de año + motor de promoción + SIAGIE | ⬜ Pendiente |
| Sprint 8 | Portal apoderado y docente | ⬜ Pendiente |
| Sprint 9 | Notificaciones WhatsApp/email | ⬜ Pendiente |

---

## Marco normativo

El sistema implementa la normativa peruana vigente para EBR:

- **Ley N° 28044** — Ley General de Educación
- **R.M. N° 432-2020-MINEDU** — Norma SIAGIE (obligatorio para todas las IE)
- **R.M. N° 452-2025-MINEDU** — Modifica norma SIAGIE
- **R.M. N° 048-2024-MINEDU** — Evaluación de competencias EBR
- **R.V.M. N° 094-2020-MINEDU** — Escalas de calificación y reglas de promoción
- **Ley N° 27665** — Prohíbe condicionar notas o matrícula al pago de pensiones
