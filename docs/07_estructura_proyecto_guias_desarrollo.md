# Documento 7 — Estructura del Proyecto y Guías de Desarrollo
## Sistema de Gestión Escolar · EBR Perú · Monorepo NestJS + Vue 3

> **Serie:** Contexto Técnico para Sistema Multitenant de Gestión Escolar Peruana  
> **Documento:** 7 (complementario)  
> **Stack:** NestJS · Vue 3 + TypeScript · PostgreSQL · Prisma · Pinia · TanStack Query  
> **Última revisión:** Marzo 2026  

---

## 1. Estructura del monorepo

```
sige-escolar/                          ← Raíz del monorepo
│
├── apps/
│   ├── api/                           ← Backend NestJS
│   └── web/                           ← Frontend Vue 3
│
├── packages/
│   ├── types/                         ← Tipos TypeScript compartidos
│   │   ├── src/
│   │   │   ├── entities/              ← Interfaces de entidades (Estudiante, Matricula, etc.)
│   │   │   ├── dtos/                  ← DTOs compartidos entre api y web
│   │   │   ├── enums/                 ← Enums compartidos (EstadoMatricula, TipoDocumento, etc.)
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── utils/                         ← Utilidades compartidas
│       ├── src/
│       │   ├── formatters.ts          ← Formateo de fechas, números, calificativos
│       │   ├── validators.ts          ← Validaciones comunes (DNI, UBIGEO, etc.)
│       │   └── index.ts
│       └── package.json
│
├── prisma/                            ← Schema y migraciones (compartido)
│   ├── schema.prisma
│   ├── migrations/
│   └── seed/
│       ├── areas-cneb.ts
│       ├── competencias-cneb.ts
│       ├── ubigeos.ts
│       └── index.ts
│
├── scripts/                           ← Scripts de administración
│   ├── create-tenant.ts               ← Crea schema + semilla para un nuevo colegio
│   ├── migrate-all-tenants.ts         ← Aplica migraciones a todos los schemas
│   └── seed-feriados.ts              ← Carga feriados nacionales del año
│
├── .env                               ← Variables de entorno (no commitear)
├── .env.example                       ← Plantilla de variables de entorno
├── .eslintrc.js                       ← ESLint compartido
├── .prettierrc                        ← Prettier compartido
├── tsconfig.base.json                 ← TypeScript base compartido
├── package.json                       ← Scripts raíz (npm workspaces)
└── README.md
```

### 1.1 package.json raíz (npm workspaces)

```json
{
  "name": "sige-escolar",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:api\" \"npm run dev:web\"",
    "dev:api": "npm run dev --workspace=apps/api",
    "dev:web": "npm run dev --workspace=apps/web",
    "build": "npm run build --workspaces",
    "db:migrate": "npx prisma migrate dev",
    "db:seed": "npx ts-node prisma/seed/index.ts",
    "db:studio": "npx prisma studio",
    "tenant:create": "npx ts-node scripts/create-tenant.ts",
    "lint": "eslint . --ext .ts,.vue",
    "format": "prettier --write \"**/*.{ts,vue,json}\""
  },
  "devDependencies": {
    "concurrently": "^8.0.0",
    "typescript": "^5.4.0",
    "prettier": "^3.0.0",
    "eslint": "^8.0.0"
  }
}
```

---

## 2. Estructura detallada — Backend (apps/api)

```
apps/api/
│
├── src/
│   ├── main.ts                        ← Bootstrap de la app
│   ├── app.module.ts                  ← Módulo raíz
│   │
│   ├── config/                        ← Configuración de la aplicación
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   └── jwt.config.ts
│   │
│   ├── common/                        ← Utilidades transversales
│   │   ├── decorators/
│   │   │   ├── tenant.decorator.ts    ← @CurrentTenant()
│   │   │   ├── user.decorator.ts      ← @CurrentUser()
│   │   │   └── roles.decorator.ts     ← @Roles('DIRECTOR', 'DOCENTE')
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts ← Manejo global de errores
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── tenant.guard.ts
│   │   ├── interceptors/
│   │   │   ├── response.interceptor.ts  ← Formato estándar de respuesta
│   │   │   └── logging.interceptor.ts
│   │   ├── middleware/
│   │   │   └── tenant.middleware.ts     ← Resuelve el tenant por request
│   │   ├── pipes/
│   │   │   ├── validation.pipe.ts
│   │   │   └── parse-uuid.pipe.ts
│   │   └── dto/
│   │       ├── pagination.dto.ts        ← PaginationDto reutilizable
│   │       └── api-response.dto.ts      ← Wrapper de respuesta estándar
│   │
│   ├── database/                      ← Capa de datos
│   │   ├── prisma.service.ts          ← PrismaClient para schema public
│   │   ├── tenant-prisma.service.ts   ← PrismaClient por tenant
│   │   └── database.module.ts
│   │
│   ├── auth/                          ← Módulo de autenticación
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── refresh-token.dto.ts
│   │
│   ├── modules/                       ← Módulos de negocio
│   │   ├── estudiantes/
│   │   │   ├── estudiantes.module.ts
│   │   │   ├── estudiantes.controller.ts
│   │   │   ├── estudiantes.service.ts
│   │   │   ├── reniec.service.ts      ← Consulta DNI a RENIEC
│   │   │   └── dto/
│   │   │       ├── create-estudiante.dto.ts
│   │   │       ├── update-estudiante.dto.ts
│   │   │       └── estudiante-response.dto.ts
│   │   │
│   │   ├── matriculas/
│   │   ├── notas/
│   │   ├── asistencia/
│   │   ├── periodos/
│   │   ├── secciones/
│   │   ├── docentes/
│   │   ├── calendario/
│   │   ├── cierre/
│   │   │   ├── cierre.service.ts      ← PromocionService + CierreAnioService
│   │   │   └── promocion.service.ts
│   │   ├── reportes/
│   │   │   ├── pdf.service.ts         ← Generación de PDFs con Puppeteer
│   │   │   └── exportacion.service.ts ← Generación de Excels para SIAGIE
│   │   ├── notificaciones/
│   │   │   ├── whatsapp.service.ts
│   │   │   └── email.service.ts
│   │   └── tenants/                   ← Solo accesible por SUPER_ADMIN
│   │       ├── tenants.module.ts
│   │       └── tenants.service.ts
│   │
│   └── jobs/                          ← Jobs asíncronos con BullMQ
│       ├── jobs.module.ts
│       ├── pdf.job.ts
│       ├── alertas.job.ts             ← Revisa umbrales de asistencia
│       └── justificaciones.job.ts     ← Vence plazo de justificación
│
├── test/
│   ├── unit/
│   └── e2e/
│
├── nest-cli.json
├── tsconfig.json                      ← Extiende de tsconfig.base.json
└── package.json
```

---

## 3. Estructura detallada — Frontend (apps/web)

```
apps/web/
│
├── src/
│   ├── main.ts
│   ├── App.vue
│   │
│   ├── assets/
│   │   ├── styles/
│   │   │   ├── main.css               ← Tailwind directives + CSS variables
│   │   │   └── themes/
│   │   │       └── educativo.css      ← Paleta de colores del sistema
│   │   └── icons/                     ← SVGs personalizados
│   │
│   ├── router/
│   │   ├── index.ts                   ← Vue Router con guards
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   └── routes/
│   │       ├── auth.routes.ts
│   │       ├── dashboard.routes.ts
│   │       ├── estudiantes.routes.ts
│   │       ├── notas.routes.ts
│   │       ├── asistencia.routes.ts
│   │       └── configuracion.routes.ts
│   │
│   ├── stores/                        ← Pinia stores
│   │   ├── auth.store.ts
│   │   ├── tenant.store.ts
│   │   ├── ui.store.ts                ← Sidebar collapsed, theme, etc.
│   │   ├── estudiantes.store.ts
│   │   ├── notas.store.ts
│   │   └── asistencia.store.ts
│   │
│   ├── api/                           ← Capa de comunicación con el backend
│   │   ├── client.ts                  ← Instancia de Axios configurada
│   │   ├── interceptors.ts            ← Request/response interceptors
│   │   └── services/                  ← Un archivo por módulo
│   │       ├── auth.service.ts
│   │       ├── estudiantes.service.ts
│   │       ├── matriculas.service.ts
│   │       ├── notas.service.ts
│   │       ├── asistencia.service.ts
│   │       └── reportes.service.ts
│   │
│   ├── composables/                   ← Lógica reutilizable (Vue Composition API)
│   │   ├── useAuth.ts
│   │   ├── usePagination.ts
│   │   ├── useDebounce.ts
│   │   ├── useConfirm.ts              ← Modal de confirmación reutilizable
│   │   ├── useToast.ts
│   │   └── useTableQuery.ts           ← Integra TanStack Query con tablas paginadas
│   │
│   ├── layouts/
│   │   ├── AuthLayout.vue             ← Layout de login / recuperar contraseña
│   │   └── DashboardLayout.vue        ← Layout principal con sidebar
│   │
│   ├── components/
│   │   ├── ui/                        ← Componentes base del Design System
│   │   │   ├── Button.vue
│   │   │   ├── Input.vue
│   │   │   ├── Select.vue
│   │   │   ├── Badge.vue              ← Para calificativos AD/A/B/C
│   │   │   ├── Table.vue              ← Tabla con sort, paginación integrada
│   │   │   ├── Modal.vue
│   │   │   ├── Card.vue
│   │   │   ├── Skeleton.vue           ← Loading states
│   │   │   ├── Alert.vue
│   │   │   ├── Tooltip.vue
│   │   │   └── Pagination.vue
│   │   │
│   │   ├── layout/
│   │   │   ├── Sidebar.vue            ← Menú lateral colapsable con iconos + tooltip
│   │   │   ├── SidebarItem.vue
│   │   │   ├── Topbar.vue
│   │   │   └── Breadcrumb.vue
│   │   │
│   │   ├── forms/
│   │   │   ├── FormField.vue          ← Wrapper con label + error + helper text
│   │   │   ├── SearchInput.vue        ← Input de búsqueda con debounce
│   │   │   └── DniInput.vue           ← Input de DNI con validación + autocompletado RENIEC
│   │   │
│   │   └── domain/                    ← Componentes específicos del negocio
│   │       ├── estudiantes/
│   │       │   ├── EstudianteCard.vue
│   │       │   └── EstudianteBadge.vue
│   │       ├── notas/
│   │       │   ├── CalificativoInput.vue  ← Input de nota AD/A/B/C o 0-20
│   │       │   ├── GrillaNotas.vue        ← Tabla de registro de notas
│   │       │   └── CalificativoBadge.vue  ← Badge coloreado por nivel de logro
│   │       ├── asistencia/
│   │       │   ├── ListaAsistencia.vue
│   │       │   └── AlertaBadge.vue
│   │       └── dashboard/
│   │           ├── StatCard.vue
│   │           ├── AlertasWidget.vue
│   │           └── SyncStatusWidget.vue   ← Estado de sincronización SIAGIE
│   │
│   ├── views/                         ← Páginas (una por ruta)
│   │   ├── auth/
│   │   │   └── LoginView.vue
│   │   ├── dashboard/
│   │   │   └── DashboardView.vue
│   │   ├── estudiantes/
│   │   │   ├── EstudiantesListView.vue
│   │   │   ├── EstudianteDetailView.vue
│   │   │   └── EstudianteCreateView.vue
│   │   ├── notas/
│   │   │   ├── NotasSeccionView.vue
│   │   │   └── NotasEstudianteView.vue
│   │   ├── asistencia/
│   │   │   ├── AsistenciaDiariaView.vue
│   │   │   └── AsistenciaReportesView.vue
│   │   └── configuracion/
│   │       ├── TenantConfigView.vue
│   │       └── AnioEscolarView.vue
│   │
│   └── types/                         ← Tipos locales del frontend (complementan @sige/types)
│       └── ui.types.ts
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Guía de buenas prácticas — Backend (NestJS)

### 4.1 Respuestas estandarizadas

Todas las respuestas de la API siguen el mismo envelope. El `ResponseInterceptor` lo aplica globalmente.

```typescript
// src/common/dto/api-response.dto.ts

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
  timestamp: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

```typescript
// src/common/interceptors/response.interceptor.ts

import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../dto/api-response.dto';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>> {

  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // Si el servicio ya devuelve { data, meta } (paginado), lo respeta
        if (data && data.__paginated) {
          const { items, meta } = data;
          return {
            success: true,
            data: items,
            meta,
            timestamp: new Date().toISOString(),
          };
        }
        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
```

**Resultado esperado en cada endpoint:**

```json
// GET /api/estudiantes?page=1&limit=20
{
  "success": true,
  "data": [ { "id": "...", "nombres": "..." } ],
  "meta": {
    "total": 156,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2025-03-18T10:30:00.000Z"
}

// POST /api/matriculas (recurso creado)
{
  "success": true,
  "data": { "id": "...", "tipo_matricula": "CONTINUIDAD" },
  "message": "Matrícula registrada correctamente",
  "timestamp": "2025-03-18T10:30:01.000Z"
}
```

### 4.2 Paginación estándar

```typescript
// src/common/dto/pagination.dto.ts

import { IsOptional, IsPositive, Max, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page: number = 1;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}
```

```typescript
// src/common/helpers/paginate.helper.ts
// Helper para construir respuestas paginadas con Prisma

export async function paginate<T>(
  model: any,
  args: any,
  pagination: PaginationDto,
): Promise<{ items: T[]; meta: PaginationMeta; __paginated: true }> {
  const [total, items] = await Promise.all([
    model.count({ where: args.where }),
    model.findMany({
      ...args,
      take: pagination.limit,
      skip: pagination.skip,
    }),
  ]);

  return {
    __paginated: true,
    items,
    meta: {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
      hasNext: pagination.page < Math.ceil(total / pagination.limit),
      hasPrev: pagination.page > 1,
    },
  };
}
```

**Uso en un servicio:**

```typescript
// estudiantes.service.ts
async findAll(tenantDb: PrismaClient, pagination: PaginationDto) {
  return paginate(tenantDb.estudiantes, {
    where: {
      deleted_at: null,
      OR: pagination.search ? [
        { apellido_paterno: { contains: pagination.search, mode: 'insensitive' } },
        { nombres: { contains: pagination.search, mode: 'insensitive' } },
        { dni: { contains: pagination.search } },
      ] : undefined,
    },
    orderBy: { [pagination.sortBy ?? 'apellido_paterno']: pagination.sortOrder },
  }, pagination);
}
```

### 4.3 Manejo global de errores

```typescript
// src/common/filters/http-exception.filter.ts

import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let errors: string[] | undefined;

    // Errores HTTP de NestJS (validación, 404, 403, etc.)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object') {
        const res = exceptionResponse as any;
        message = res.message ?? message;
        // class-validator devuelve array de mensajes
        if (Array.isArray(res.message)) {
          errors = res.message;
          message = 'Error de validación';
        }
      }
    }

    // Errores de Prisma
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'El registro ya existe (dato duplicado)';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Registro no encontrado';
          break;
        default:
          status = HttpStatus.UNPROCESSABLE_ENTITY;
          message = 'Error en la base de datos';
      }
    }

    // Log del error para debugging
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      success: false,
      message,
      errors,
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### 4.4 Seguridad

```typescript
// main.ts — configuración de seguridad global

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Seguridad de cabeceras HTTP
  app.use(helmet());

  // CORS restringido al dominio del frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });

  // Prefijo global de la API
  app.setGlobalPrefix('api/v1');

  // Validación estricta de DTOs — rechaza campos no declarados
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,       // Strip de campos no declarados en el DTO
    forbidNonWhitelisted: true, // Lanza error si llegan campos extra
    transform: true,       // Transforma tipos automáticamente (string → number)
    transformOptions: { enableImplicitConversion: true },
  }));

  // Filtro global de errores
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Interceptor de respuesta estándar
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

**Estrategias de seguridad adicionales:**

```typescript
// JWT con refresh token + rotación
// auth.service.ts

async login(dto: LoginDto) {
  const user = await this.validateUser(dto.email, dto.password);

  const accessToken = this.jwt.sign(
    { sub: user.id, tenantId: user.tenantId, rol: user.rol },
    { expiresIn: '15m' }        // Access token de corta duración
  );

  const refreshToken = this.jwt.sign(
    { sub: user.id },
    { expiresIn: '7d' }         // Refresh token de larga duración
  );

  // Guardar hash del refresh token en BD (para revocación)
  await this.storeRefreshToken(user.id, refreshToken);

  return { accessToken, refreshToken };
}

// Rate limiting por IP y por usuario
// Usar @nestjs/throttler
// 100 requests / 60 segundos por IP
// 10 requests / 60 segundos en endpoints de auth
```

### 4.5 Estrategia de módulos

Cada módulo sigue la misma estructura interna:

```
module/
  ├── module.ts          ← Importa sus dependencias
  ├── controller.ts      ← Solo maneja HTTP: extrae parámetros, llama al service
  ├── service.ts         ← Toda la lógica de negocio
  ├── repository.ts      ← (Opcional) Abstrae queries complejas de Prisma
  └── dto/
      ├── create-X.dto.ts
      ├── update-X.dto.ts
      ├── filter-X.dto.ts    ← Extiende PaginationDto con filtros del módulo
      └── X-response.dto.ts  ← Forma exacta de la respuesta (para documentación)
```

**Regla:** El controller **nunca** contiene lógica de negocio. El service **nunca** conoce la Request de HTTP. Los DTOs usan `class-validator` para toda validación de entrada.

```typescript
// Ejemplo de controller limpio
@Controller('estudiantes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EstudiantesController {

  constructor(private readonly estudiantesService: EstudiantesService) {}

  @Get()
  @Roles('DIRECTOR', 'SECRETARIA', 'DOCENTE_TUTOR')
  findAll(
    @CurrentTenant() tenant: Tenant,
    @Query() pagination: EstudianteFilterDto,
  ) {
    // Solo extrae parámetros y delega — sin lógica aquí
    return this.estudiantesService.findAll(tenant, pagination);
  }

  @Post()
  @Roles('DIRECTOR', 'SECRETARIA')
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: Usuario,
    @Body() dto: CreateEstudianteDto,
  ) {
    return this.estudiantesService.create(tenant, user, dto);
  }
}
```

### 4.6 Variables de entorno

```bash
# .env.example

# Base de datos
DATABASE_URL="postgresql://user:pass@localhost:5432/sige_escolar?schema=public"

# JWT
JWT_SECRET="cambiar-por-secreto-seguro-minimo-32-chars"
JWT_REFRESH_SECRET="cambiar-por-secreto-refresh-diferente"

# App
PORT=3000
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"

# Almacenamiento de archivos
R2_ACCOUNT_ID=""
R2_ACCESS_KEY=""
R2_SECRET_KEY=""
R2_BUCKET="sige-escolar"
R2_PUBLIC_URL=""

# RENIEC (proveedor API)
RENIEC_API_URL=""
RENIEC_API_KEY=""

# Email (Resend)
RESEND_API_KEY=""
EMAIL_FROM="noreply@sige.edu.pe"

# WhatsApp Business API
WHATSAPP_API_URL=""
WHATSAPP_TOKEN=""

# Redis (para BullMQ)
REDIS_HOST="localhost"
REDIS_PORT=6379
```

---

## 5. Guía de buenas prácticas — Frontend (Vue 3)

### 5.1 Paleta de colores — Sector educativo

La paleta está diseñada para transmitir **confianza, claridad y profesionalismo**, evitando los tonos demasiado corporativos o los colores saturados que dificultan la lectura en pantallas de bajo contraste.

```css
/* src/assets/styles/themes/educativo.css */

:root {
  /* ─── Azul institucional ─── */
  --color-primary-50:  #EFF6FF;
  --color-primary-100: #DBEAFE;
  --color-primary-200: #BFDBFE;
  --color-primary-400: #60A5FA;
  --color-primary-500: #3B82F6;   /* ← Color principal del sistema */
  --color-primary-600: #2563EB;   /* ← Botones, links activos */
  --color-primary-700: #1D4ED8;
  --color-primary-900: #1E3A8A;

  /* ─── Verde éxito / promovido ─── */
  --color-success-50:  #F0FDF4;
  --color-success-100: #DCFCE7;
  --color-success-500: #22C55E;
  --color-success-600: #16A34A;   /* ← "PROMOVIDO", asistencia OK */
  --color-success-700: #15803D;

  /* ─── Ámbar advertencia ─── */
  --color-warning-50:  #FFFBEB;
  --color-warning-100: #FEF3C7;
  --color-warning-500: #F59E0B;
  --color-warning-600: #D97706;   /* ← Alertas medias, "EN PROCESO" (B) */

  /* ─── Rojo peligro / permanece ─── */
  --color-danger-50:   #FEF2F2;
  --color-danger-100:  #FEE2E2;
  --color-danger-500:  #EF4444;
  --color-danger-600:  #DC2626;   /* ← "PERMANECE", faltas críticas */

  /* ─── Neutral ─── */
  --color-gray-50:  #F9FAFB;
  --color-gray-100: #F3F4F6;
  --color-gray-200: #E5E7EB;
  --color-gray-300: #D1D5DB;
  --color-gray-400: #9CA3AF;
  --color-gray-500: #6B7280;
  --color-gray-600: #4B5563;
  --color-gray-700: #374151;
  --color-gray-800: #1F2937;
  --color-gray-900: #111827;

  /* ─── Colores de calificativos (específicos del negocio) ─── */
  --color-ad: #7C3AED;            /* Violeta — logro destacado */
  --color-a:  #16A34A;            /* Verde — logro esperado */
  --color-b:  #D97706;            /* Ámbar — en proceso */
  --color-c:  #DC2626;            /* Rojo — en inicio */
  --color-exo: #6B7280;           /* Gris — exonerado */

  /* ─── Superficies ─── */
  --color-bg:        #F9FAFB;     /* Fondo general de la app */
  --color-surface:   #FFFFFF;     /* Cards, modales, sidebar */
  --color-border:    #E5E7EB;     /* Bordes sutiles */
  --color-text-primary:   #111827;
  --color-text-secondary: #6B7280;
  --color-text-muted:     #9CA3AF;

  /* ─── Sidebar ─── */
  --sidebar-bg:      #1E3A8A;     /* Azul oscuro institucional */
  --sidebar-text:    #BFDBFE;     /* Texto en el sidebar */
  --sidebar-active:  #3B82F6;     /* Item activo */
  --sidebar-hover:   #1D4ED8;     /* Hover de items */
  --sidebar-width:   240px;
  --sidebar-collapsed-width: 64px;
}
```

**Asignación semántica de colores para calificativos:**

| Calificativo | Color | Uso |
|---|---|---|
| **AD** | Violeta `#7C3AED` | Logro destacado — diferente para distinguirlo del "A" |
| **A** | Verde `#16A34A` | Logro esperado — el color de éxito natural |
| **B** | Ámbar `#D97706` | En proceso — precaución sin alarma |
| **C** | Rojo `#DC2626` | En inicio — requiere atención |
| **EXO** | Gris `#6B7280` | Exonerado — neutro, sin peso en la evaluación |
| **PROMOVIDO** | Verde | Resultado positivo |
| **RECUPERACIÓN** | Ámbar | Situación intermedia |
| **PERMANECE** | Rojo | Situación crítica |

### 5.2 Diseño del sidebar colapsable

```vue
<!-- src/components/layout/Sidebar.vue -->
<template>
  <aside
    class="sidebar"
    :class="{ 'sidebar--collapsed': isCollapsed }"
    :style="{
      width: isCollapsed
        ? 'var(--sidebar-collapsed-width)'
        : 'var(--sidebar-width)'
    }"
  >
    <!-- Logo / Nombre del colegio -->
    <div class="sidebar__brand">
      <img v-if="!isCollapsed" :src="tenantLogo" class="brand__logo" alt="Logo" />
      <img v-else :src="tenantLogoIcon" class="brand__icon" alt="Logo" />
    </div>

    <!-- Toggle collapse -->
    <button
      class="sidebar__toggle"
      @click="uiStore.toggleSidebar()"
      :title="isCollapsed ? 'Expandir menú' : 'Colapsar menú'"
    >
      <ChevronLeftIcon v-if="!isCollapsed" class="icon" />
      <ChevronRightIcon v-else class="icon" />
    </button>

    <!-- Navegación principal -->
    <nav class="sidebar__nav">
      <SidebarItem
        v-for="item in menuItems"
        :key="item.path"
        :item="item"
        :collapsed="isCollapsed"
      />
    </nav>

    <!-- Info del usuario en el fondo -->
    <div class="sidebar__footer">
      <div v-if="!isCollapsed" class="user-info">
        <span class="user-info__name">{{ currentUser?.nombres }}</span>
        <span class="user-info__role">{{ formatRol(currentUser?.rol) }}</span>
      </div>
      <button
        class="logout-btn"
        @click="authStore.logout()"
        v-tooltip="isCollapsed ? 'Cerrar sesión' : undefined"
      >
        <LogOutIcon class="icon" />
      </button>
    </div>
  </aside>
</template>
```

```vue
<!-- src/components/layout/SidebarItem.vue -->
<!-- Item del menú con tooltip cuando está colapsado -->
<template>
  <div class="sidebar-item-wrapper">
    <RouterLink
      :to="item.path"
      class="sidebar-item"
      :class="{ 'sidebar-item--active': isActive }"
      v-tooltip="collapsed ? item.label : undefined"
      tooltip-placement="right"
    >
      <component :is="item.icon" class="sidebar-item__icon" />
      <Transition name="fade">
        <span v-if="!collapsed" class="sidebar-item__label">
          {{ item.label }}
        </span>
      </Transition>
      <!-- Badge de notificaciones (ej: alertas de asistencia) -->
      <span
        v-if="item.badge && !collapsed"
        class="sidebar-item__badge"
      >
        {{ item.badge }}
      </span>
      <span
        v-if="item.badge && collapsed"
        class="sidebar-item__badge--dot"
      />
    </RouterLink>
  </div>
</template>
```

**Definición del menú según el rol:**

```typescript
// src/router/menu.config.ts

import {
  HomeIcon, UsersIcon, ClipboardListIcon,
  CalendarIcon, BarChartIcon, SettingsIcon,
  FileTextIcon, AlertCircleIcon
} from 'lucide-vue-next';

export const menuByRole = {
  DIRECTOR: [
    { label: 'Dashboard',     path: '/dashboard',    icon: HomeIcon,          badge: null },
    { label: 'Estudiantes',   path: '/estudiantes',  icon: UsersIcon,         badge: null },
    { label: 'Notas',         path: '/notas',        icon: ClipboardListIcon, badge: null },
    { label: 'Asistencia',    path: '/asistencia',   icon: CalendarIcon,      badge: 'alertas' },
    { label: 'Reportes',      path: '/reportes',     icon: BarChartIcon,      badge: null },
    { label: 'SIAGIE',        path: '/siagie',       icon: FileTextIcon,      badge: 'pendientes' },
    { label: 'Configuración', path: '/configuracion',icon: SettingsIcon,      badge: null },
  ],
  DOCENTE_AREA: [
    { label: 'Mis Notas',     path: '/notas',        icon: ClipboardListIcon, badge: null },
    { label: 'Asistencia',    path: '/asistencia',   icon: CalendarIcon,      badge: null },
  ],
  DOCENTE_TUTOR: [
    { label: 'Mi Sección',    path: '/seccion',      icon: UsersIcon,         badge: null },
    { label: 'Notas',         path: '/notas',        icon: ClipboardListIcon, badge: null },
    { label: 'Asistencia',    path: '/asistencia',   icon: CalendarIcon,      badge: 'alertas' },
  ],
  APODERADO: [
    { label: 'Mi Hijo/a',     path: '/hijo',         icon: UsersIcon,         badge: null },
    { label: 'Notas',         path: '/notas',        icon: ClipboardListIcon, badge: null },
    { label: 'Asistencia',    path: '/asistencia',   icon: CalendarIcon,      badge: null },
  ],
};
```

### 5.3 Capa de API con Axios

```typescript
// src/api/client.ts

import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/composables/useToast';
import router from '@/router';

const client: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request: inyectar token ───────────────────────────────────────
client.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  if (authStore.accessToken) {
    config.headers.Authorization = `Bearer ${authStore.accessToken}`;
  }
  return config;
});

// ─── Response: manejo de errores + refresh token ───────────────────
client.interceptors.response.use(
  (response) => response.data,  // Devuelve directamente data (no response.data.data)
  async (error) => {
    const originalRequest = error.config;

    // 401 → intentar refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const authStore = useAuthStore();

      try {
        await authStore.refreshToken();
        originalRequest.headers.Authorization = `Bearer ${authStore.accessToken}`;
        return client(originalRequest);
      } catch {
        authStore.logout();
        router.push('/login');
        return Promise.reject(error);
      }
    }

    // Mostrar toast con el mensaje de error del backend
    const toast = useToast();
    const message = error.response?.data?.message ?? 'Error de conexión';
    const errors  = error.response?.data?.errors;

    if (error.response?.status !== 401) {
      toast.error(message, errors);
    }

    return Promise.reject(error.response?.data);
  },
);

export default client;
```

```typescript
// src/api/services/estudiantes.service.ts
// Cada servicio es una colección de funciones puras

import client from '../client';
import type { ApiResponse, PaginationMeta } from '@sige/types';
import type { Estudiante, CreateEstudianteDto } from '@sige/types';

export const estudiantesService = {
  findAll: (params: Record<string, any>) =>
    client.get<never, ApiResponse<Estudiante[]>>('/estudiantes', { params }),

  findOne: (id: string) =>
    client.get<never, ApiResponse<Estudiante>>(`/estudiantes/${id}`),

  create: (dto: CreateEstudianteDto) =>
    client.post<never, ApiResponse<Estudiante>>('/estudiantes', dto),

  update: (id: string, dto: Partial<CreateEstudianteDto>) =>
    client.patch<never, ApiResponse<Estudiante>>(`/estudiantes/${id}`, dto),

  validateDni: (dni: string) =>
    client.get<never, ApiResponse<{ nombres: string; apellidos: string }>>
      (`/estudiantes/validate-dni/${dni}`),
};
```

### 5.4 Pinia stores

```typescript
// src/stores/ui.store.ts — Estado de la interfaz

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useUiStore = defineStore('ui', () => {
  const sidebarCollapsed = ref(false);
  const theme = ref<'light' | 'dark'>('light');

  // Persistir preferencia del usuario
  const savedCollapsed = localStorage.getItem('sidebar-collapsed');
  if (savedCollapsed !== null) sidebarCollapsed.value = savedCollapsed === 'true';

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value;
    localStorage.setItem('sidebar-collapsed', String(sidebarCollapsed.value));
  }

  return { sidebarCollapsed, theme, toggleSidebar };
});
```

```typescript
// src/stores/auth.store.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '@/api/services/auth.service';
import type { Usuario } from '@sige/types';

export const useAuthStore = defineStore('auth', () => {
  const accessToken  = ref<string | null>(localStorage.getItem('access_token'));
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'));
  const currentUser  = ref<Usuario | null>(null);

  const isAuthenticated = computed(() => !!accessToken.value);

  async function login(email: string, password: string) {
    const { data } = await authService.login({ email, password });
    accessToken.value  = data.accessToken;
    refreshToken.value = data.refreshToken;
    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    await fetchCurrentUser();
  }

  async function fetchCurrentUser() {
    const { data } = await authService.me();
    currentUser.value = data;
  }

  async function refreshAccessToken() {
    const { data } = await authService.refresh(refreshToken.value!);
    accessToken.value = data.accessToken;
    localStorage.setItem('access_token', data.accessToken);
  }

  function logout() {
    accessToken.value = refreshToken.value = null;
    currentUser.value = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  return {
    accessToken, refreshToken, currentUser,
    isAuthenticated, login, logout,
    refreshToken: refreshAccessToken,
    fetchCurrentUser,
  };
}, {
  // No persistir todo el store — solo tokens (ya en localStorage)
});
```

### 5.5 TanStack Query para server state

```typescript
// src/composables/useTableQuery.ts
// Composable reutilizable para tablas paginadas con TanStack Query

import { ref, computed, watch } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import type { PaginationDto } from '@sige/types';

export function useTableQuery<T>(
  queryKey: string,
  fetchFn: (params: PaginationDto) => Promise<any>,
  initialParams: Partial<PaginationDto> = {},
) {
  const params = ref<PaginationDto>({
    page: 1,
    limit: 20,
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    ...initialParams,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [queryKey, params],
    queryFn: () => fetchFn(params.value),
    keepPreviousData: true,   // Evita flash de contenido vacío al paginar
    staleTime: 30_000,        // 30 segundos antes de revalidar
  });

  const items     = computed(() => data.value?.data ?? []);
  const meta      = computed(() => data.value?.meta);
  const totalPages = computed(() => meta.value?.totalPages ?? 1);

  function setPage(page: number)     { params.value.page = page; }
  function setSearch(search: string) { params.value = { ...params.value, search, page: 1 }; }
  function setSort(field: string, order: 'asc' | 'desc') {
    params.value = { ...params.value, sortBy: field, sortOrder: order };
  }

  return { items, meta, totalPages, isLoading, isError, params, setPage, setSearch, setSort, refetch };
}
```

**Uso en una vista:**

```vue
<!-- EstudiantesListView.vue -->
<script setup lang="ts">
import { estudiantesService } from '@/api/services/estudiantes.service';
import { useTableQuery } from '@/composables/useTableQuery';

const {
  items: estudiantes,
  meta,
  isLoading,
  setPage,
  setSearch,
} = useTableQuery('estudiantes', estudiantesService.findAll);
</script>

<template>
  <div>
    <SearchInput @search="setSearch" placeholder="Buscar por nombre o DNI..." />
    <Table :data="estudiantes" :loading="isLoading" :columns="columns" />
    <Pagination :meta="meta" @page-change="setPage" />
  </div>
</template>
```

### 5.6 Manejo de errores en el frontend

```typescript
// src/composables/useToast.ts
// Toast integrado con el manejador de errores del cliente Axios

import { useToast as usePrimeToast } from 'primevue/usetoast';
// O cualquier librería de notificaciones: vue-toastification, sonner-vue, etc.

export function useToast() {
  const toast = usePrimeToast();

  return {
    success: (message: string) => toast.add({
      severity: 'success', summary: 'Éxito', detail: message, life: 3000
    }),
    error: (message: string, errors?: string[]) => toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errors ? errors.join(' · ') : message,
      life: 5000,
    }),
    warning: (message: string) => toast.add({
      severity: 'warn', summary: 'Advertencia', detail: message, life: 4000
    }),
    info: (message: string) => toast.add({
      severity: 'info', summary: 'Información', detail: message, life: 3000
    }),
  };
}
```

### 5.7 Separación de responsabilidades en componentes

```
Regla de oro: Un componente hace UNA cosa.

View (pages/views)
  └── Orquesta la página. Usa composables, no lógica de negocio directa.
      Renderiza componentes domain y ui.

Componente domain
  └── Conoce el negocio (Estudiante, Nota, etc.) pero no llama a la API.
      Recibe datos por props y emite eventos.

Componente ui
  └── No conoce el negocio. Solo recibe datos genéricos y emite eventos.
      Button, Input, Table, Badge, Modal, etc.

Composable
  └── Lógica de comportamiento reutilizable sin renderizado.
      usePagination, useDebounce, useConfirm, etc.

Store (Pinia)
  └── Estado GLOBAL que vive entre rutas (auth, tenant, ui, alertas).
      NO usar para estado local de una sola vista — usar ref/reactive en el setup.
```

### 5.8 Componente CalificativoBadge (ejemplo de componente domain)

```vue
<!-- src/components/domain/notas/CalificativoBadge.vue -->
<script setup lang="ts">
defineProps<{
  calificativo: 'AD' | 'A' | 'B' | 'C' | 'EXO' | null;
}>();

const colorMap = {
  AD:  'badge--ad',
  A:   'badge--a',
  B:   'badge--b',
  C:   'badge--c',
  EXO: 'badge--exo',
};

const labelMap = {
  AD:  'AD',
  A:   'A',
  B:   'B',
  C:   'C',
  EXO: 'EXO',
};
</script>

<template>
  <span
    v-if="calificativo"
    class="badge"
    :class="colorMap[calificativo]"
    :title="{
      AD: 'Logro destacado',
      A:  'Logro esperado',
      B:  'En proceso',
      C:  'En inicio',
      EXO: 'Exonerado',
    }[calificativo]"
  >
    {{ labelMap[calificativo] }}
  </span>
  <span v-else class="badge badge--empty">—</span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 1.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.025em;
}
.badge--ad  { background: #EDE9FE; color: var(--color-ad); }
.badge--a   { background: #DCFCE7; color: var(--color-a); }
.badge--b   { background: #FEF3C7; color: var(--color-b); }
.badge--c   { background: #FEE2E2; color: var(--color-c); }
.badge--exo { background: #F3F4F6; color: var(--color-exo); }
.badge--empty { color: #D1D5DB; }
</style>
```

---

## 6. Dashboard — Principios de usabilidad

### 6.1 Layout principal

```
┌──────────────┬──────────────────────────────────────────────────┐
│              │  Topbar: breadcrumb + notificaciones + usuario    │
│   SIDEBAR    ├──────────────────────────────────────────────────┤
│  (colapsable)│                                                  │
│              │              ÁREA DE CONTENIDO                   │
│  • Dashboard │                                                  │
│  • Estudiantes│         Vista actual de la ruta                 │
│  • Notas     │                                                  │
│  • Asistencia│                                                  │
│  • Reportes  │                                                  │
│  • SIAGIE    │                                                  │
│  • Config    │                                                  │
│              │                                                  │
│  [avatar]    │                                                  │
└──────────────┴──────────────────────────────────────────────────┘

Sidebar expandido: 240px — muestra icono + texto + badge
Sidebar colapsado:  64px — muestra solo icono + tooltip al hover
Transición: CSS transition 200ms ease-in-out en el width
```

### 6.2 Dashboard principal — widgets recomendados

```
FILA 1 — Métricas rápidas (StatCards)
  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
  │ Total        │ │ Asistencia   │ │ Alertas      │ │ SIAGIE       │
  │ estudiantes  │ │ hoy          │ │ activas      │ │ pendientes   │
  │              │ │              │ │              │ │              │
  │  478         │ │  94.2%       │ │  12 🟠       │ │  3 ⏳        │
  │ ↑ 12 vs ayer │ │ ↓ 1.3%       │ │ 2 🔴 10 🟡  │ │ Bim 2, Asist │
  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

FILA 2 — Widgets de gestión
  ┌────────────────────────────┐ ┌───────────────────────────────────┐
  │ Alertas de asistencia      │ │ Estado de sincronización SIAGIE   │
  │ (lista de estudiantes con  │ │                                   │
  │ alto riesgo de abandono)   │ │ Matrícula      ✅ 15/02           │
  │                            │ │ Asistencia Mar ✅ 02/04           │
  │ 🔴 López Ramírez, A.  32%  │ │ Asistencia Abr ✅ 03/05           │
  │ 🔴 García Torres, M.  28%  │ │ Asistencia May ⏳ Pendiente       │
  │ 🟠 Ríos Sánchez, K.   22%  │ │ Calific. Bim1  ✅ 12/05           │
  │ [Ver todas las alertas →]  │ │ Calific. Bim2  ⬇️ Excel listo     │
  └────────────────────────────┘ └───────────────────────────────────┘

FILA 3 — Notas y actividad reciente
  ┌────────────────────────────┐ ┌───────────────────────────────────┐
  │ Distribución de logros     │ │ Actividad reciente                │
  │ (gráfico de barras por     │ │                                   │
  │ área — periodo actual)     │ │ 10:32 Sra. Torres registró notas  │
  │                            │ │       de 3° A — Matemática        │
  │  AD ██████ 23%             │ │ 10:15 Alerta: López M. 32% falta  │
  │  A  ████████████ 48%       │ │ 09:45 Libreta enviada a 28 padres │
  │  B  ████ 18%               │ │       de 2° B                     │
  │  C  ███ 11%                │ │ 09:30 Asistencia Abr exportada    │
  └────────────────────────────┘ └───────────────────────────────────┘
```

### 6.3 Principios UX para el sector educativo

```
1. DENSIDAD INFORMATIVA MODERADA
   Los directores y docentes ven muchos datos. Usar tablas compactas pero
   con espacio suficiente para leer sin esfuerzo. Line-height mínimo 1.5.
   Padding en celdas: 12px vertical, 16px horizontal.

2. ESTADOS VISUALES CLAROS
   Siempre mostrar: loading skeleton (no spinner), estado vacío con CTA,
   estado de error con opción de reintentar. Nunca dejar una pantalla en
   blanco sin explicación.

3. FLUJOS LINEALES PARA TAREAS RECURRENTES
   Registrar asistencia → debe completarse en < 30 segundos por sección.
   Ingresar nota → click en la celda, tipear, Tab para la siguiente.
   La grilla de notas debe ser operada completamente con teclado.

4. CONFIRMACIÓN ANTES DE ACCIONES DESTRUCTIVAS
   Cerrar un periodo, retirar un estudiante, aprobar el acta.
   Modal de confirmación con la acción descrita en texto claro.

5. FEEDBACK INMEDIATO
   Guardar nota → toast de éxito en < 500ms.
   Generar PDF → indicador de progreso si tarda más de 1 segundo.

6. RESPONSIVE MODERADO
   El sistema es principalmente de escritorio (secretaría, docentes en
   computadora). Optimizar para 1280px+. Soporte básico para tablets
   (960px+). No es una app móvil.
```

---

## 7. Checklist de desarrollo por módulo

Antes de marcar cualquier módulo como completo:

```
Backend:
  ☐ DTOs de entrada con class-validator (create, update, filter)
  ☐ Respuesta estandarizada con ApiResponse<T>
  ☐ Paginación con PaginationDto si retorna listas
  ☐ Guard de autenticación + guard de roles
  ☐ Decorador @CurrentTenant() en todos los endpoints
  ☐ Manejo de errores Prisma en el filtro global
  ☐ Al menos 1 test unitario del service (caso feliz + caso de error)

Frontend:
  ☐ Service en src/api/services/ con tipado completo
  ☐ useTableQuery (si es una lista) o useQuery directo (si es detalle)
  ☐ Loading state con Skeleton (no spinner suelto)
  ☐ Estado vacío con mensaje y CTA
  ☐ Toast en acciones mutantes (crear, editar, eliminar)
  ☐ Confirmación en acciones destructivas
  ☐ Breadcrumb actualizado en la ruta

Ambos:
  ☐ Tipos en packages/types actualizados
  ☐ Variables de entorno documentadas en .env.example
  ☐ README del módulo si tiene complejidad especial
```

---

*Documento generado como parte de la serie de contexto técnico para el sistema multitenant de gestión escolar EBR Perú.*  
*Revisitar las guías de buenas prácticas al incorporar nuevos integrantes al equipo.*
