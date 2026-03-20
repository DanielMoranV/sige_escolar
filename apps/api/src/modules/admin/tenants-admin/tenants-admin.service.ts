import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { TenantMigrationService } from '../services/tenant-migration.service';
import { TenantSeedService } from '../services/tenant-seed.service';
import { PeriodosService } from '../services/periodos.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantsAdminService {
  private readonly logger = new Logger(TenantsAdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantMigration: TenantMigrationService,
    private readonly tenantSeed: TenantSeedService,
    private readonly periodosService: PeriodosService,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 20,
    search?: string,
    plan?: string,
    activo?: boolean,
  ) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (plan) where.plan = plan;
    if (activo !== undefined) where.activo = activo;

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { datos_minedu: true },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { datos_minedu: true },
    });
    if (!tenant) throw new NotFoundException(`Tenant ${id} no encontrado`);

    // Fetch anio_escolar_config activo
    let anioEscolarConfig: { id: string; anio: number; fecha_inicio: string; fecha_fin: string; activo: boolean } | null = null;
    try {
      const anioResult = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT id, anio, fecha_inicio::text, fecha_fin::text, activo
         FROM "${tenant.slug}".anio_escolar_config
         ORDER BY activo DESC, anio DESC LIMIT 1`,
      );
      anioEscolarConfig = anioResult[0] ?? null;
    } catch {
      // schema may not have tables yet
    }

    // Fetch regimen_config from tenant schema (may not exist yet)
    let regimenConfig: Array<{ nivel: string; tipo_regimen: string }> = [];
    try {
      regimenConfig = await this.prisma.$queryRawUnsafe<Array<{ nivel: string; tipo_regimen: string }>>(
        `SELECT rc.nivel::text, rc.tipo_regimen::text
         FROM "${tenant.slug}".regimen_config rc
         JOIN "${tenant.slug}".anio_escolar_config aec ON rc.anio_escolar_id = aec.id
         ORDER BY aec.activo DESC, rc.nivel`,
      );
    } catch {
      // schema may not have tables yet
    }

    return { ...tenant, anio_escolar_config: anioEscolarConfig, regimen_config: regimenConfig };
  }

  async create(dto: CreateTenantDto) {
    const slug = this.generateSlug(dto.nombreCorto);

    // Check for slug conflicts
    const existing = await this.prisma.tenant.findFirst({ where: { slug } });
    if (existing) {
      throw new ConflictException(`El slug "${slug}" ya está en uso. Cambie el nombre corto.`);
    }

    // 1. Create tenant record in public schema
    const tenant = await this.prisma.tenant.create({
      data: {
        nombre: dto.nombre,
        nombre_corto: dto.nombreCorto,
        slug,
        schema_name: slug,
        plan: dto.plan,
        activo: true,
      },
    });

    // 2. Create the PostgreSQL schema (DDL — cannot be in a Prisma transaction)
    await this.prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${slug}"`);

    // 3. Apply tenant SQL template
    await this.tenantMigration.applyToSchema(slug);

    // 4. Create anio_escolar_config
    const anioResult = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `INSERT INTO "${slug}".anio_escolar_config (anio, fecha_inicio, fecha_fin, activo)
       VALUES ($1, $2, $3, true)
       RETURNING id`,
      dto.anioEscolar,
      dto.fechaInicio,
      dto.fechaFin,
    );
    const anioEscolarId = anioResult[0].id;

    // 5. Create regimen_config only for the selected niveles
    const regimenMap: Record<string, string | undefined> = {
      PRIMARIA: dto.regimenPrimaria,
      SECUNDARIA: dto.regimenSecundaria,
      INICIAL: dto.regimenInicial,
    };

    for (const nivel of dto.niveles) {
      const regimen = regimenMap[nivel] ?? 'BIMESTRAL';
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO "${slug}".regimen_config (anio_escolar_id, nivel, tipo_regimen)
         VALUES ($1, $2::public.nivel_educativo, $3::"${slug}".tipo_regimen)`,
        anioEscolarId,
        nivel,
        regimen,
      );
    }

    // 6. Generate periodos for each nivel
    await this.periodosService.generarPeriodos(
      slug,
      anioEscolarId,
      new Date(dto.fechaInicio),
      new Date(dto.fechaFin),
      dto.niveles,
      regimenMap,
    );

    // 7. Seed base data (grados, areas, competencias) — solo para los niveles del colegio
    await this.tenantSeed.seedTenantBase(slug, anioEscolarId, dto.niveles);

    // 8. Create tenant_datos_minedu (including director info)
    await this.prisma.tenantDatosMinedu.create({
      data: {
        tenant_id: tenant.id,
        codigo_modular: dto.codigoModular,
        nombre_oficial: dto.nombreOficial,
        dre_codigo: dto.dreCodigo,
        dre_nombre: dto.dreNombre,
        ugel_codigo: dto.ugelCodigo,
        ugel_nombre: dto.ugelNombre,
        tipo_gestion: dto.tipoGestion,
        director_dni: dto.directorDni,
        director_nombres: dto.directorNombres,
        director_apellidos: dto.directorApellidos,
      },
    });

    // 9. Create director usuario in public.usuarios
    const tempPassword = this.generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await this.prisma.usuario.create({
      data: {
        email: dto.directorEmail,
        password_hash: passwordHash,
        nombres: dto.directorNombres,
        apellidos: dto.directorApellidos,
        dni: dto.directorDni,
        rol: 'DIRECTOR',
        tenant_id: tenant.id,
        activo: true,
      },
    });

    // 10. Log credentials to console (no email service yet)
    this.logger.log(
      `\n========== CREDENCIALES DIRECTOR ==========\n` +
      `Colegio: ${dto.nombre} (slug: ${slug})\n` +
      `Email: ${dto.directorEmail}\n` +
      `Contraseña temporal: ${tempPassword}\n` +
      `==========================================`,
    );

    return {
      tenant,
      directorEmail: dto.directorEmail,
      tempPassword,
      slug,
    };
  }

  async update(id: string, dto: UpdateTenantDto) {
    const tenant = await this.findOne(id);
    const slug = tenant.slug;

    await this.prisma.tenant.update({
      where: { id },
      data: {
        ...(dto.nombre && { nombre: dto.nombre }),
        ...(dto.nombreCorto && { nombre_corto: dto.nombreCorto }),
        ...(dto.plan && { plan: dto.plan }),
      },
    });

    // Update MINEDU data if present
    const mineduFields: Record<string, unknown> = {};
    if (dto.codigoModular) mineduFields.codigo_modular = dto.codigoModular;
    if (dto.nombreOficial) mineduFields.nombre_oficial = dto.nombreOficial;
    if (dto.dreCodigo) mineduFields.dre_codigo = dto.dreCodigo;
    if (dto.dreNombre) mineduFields.dre_nombre = dto.dreNombre;
    if (dto.ugelCodigo) mineduFields.ugel_codigo = dto.ugelCodigo;
    if (dto.ugelNombre) mineduFields.ugel_nombre = dto.ugelNombre;
    if (dto.tipoGestion) mineduFields.tipo_gestion = dto.tipoGestion;
    if (dto.directorDni) mineduFields.director_dni = dto.directorDni;
    if (dto.directorNombres) mineduFields.director_nombres = dto.directorNombres;
    if (dto.directorApellidos) mineduFields.director_apellidos = dto.directorApellidos;

    if (Object.keys(mineduFields).length > 0) {
      await this.prisma.tenantDatosMinedu.upsert({
        where: { tenant_id: id },
        update: mineduFields,
        create: {
          tenant_id: id,
          codigo_modular: '0000000',
          nombre_oficial: '',
          tipo_gestion: 'PRIVADA',
          ...mineduFields,
        },
      });
    }

    // Handle Año Escolar + Niveles + Regimen updates
    const hasNivelesData = dto.niveles !== undefined;
    const hasRegimenData = !!(dto.regimenPrimaria || dto.regimenSecundaria || dto.regimenInicial);
    const hasAnioData = !!(dto.anioEscolar || dto.fechaInicio || dto.fechaFin);

    if (hasNivelesData || hasRegimenData || hasAnioData) {
      // Determine the school year dates to use
      const currentYear = new Date().getFullYear();
      const anio = dto.anioEscolar ?? currentYear;
      const fechaInicioDef = dto.fechaInicio ?? `${anio}-03-01`;
      const fechaFinDef = dto.fechaFin ?? `${anio}-12-20`;

      // Upsert anio_escolar_config — create if not exists, update dates if provided
      let anioConfig: { id: string; fecha_inicio: string; fecha_fin: string } | null = null;
      try {
        // First, check if tables exist in this schema, and run migration if they don't
        const tableCheck = await this.prisma.$queryRawUnsafe<any[]>(
          `SELECT EXISTS (
             SELECT 1 FROM information_schema.tables
             WHERE table_schema = $1 AND table_name = 'anio_escolar_config'
           ) AS exists`,
          slug,
        );
        const tablesExist = tableCheck[0]?.exists === true;

        if (!tablesExist) {
          this.logger.log(`[${slug}] Schema sin tablas — aplicando migración...`);
          await this.tenantMigration.applyToSchema(slug);
          this.logger.log(`[${slug}] Migración aplicada correctamente`);
        }

        // Try to get existing one first (prefer activo=true, then most recent)
        const existing = await this.prisma.$queryRawUnsafe<any[]>(
          `SELECT id, fecha_inicio::text, fecha_fin::text FROM "${slug}".anio_escolar_config
           ORDER BY activo DESC, anio DESC LIMIT 1`,
        );

        if (existing[0]) {
          // Update dates/activation if school year data was sent
          if (hasAnioData) {
            await this.prisma.$executeRawUnsafe(
              `UPDATE "${slug}".anio_escolar_config
               SET fecha_inicio = $1, fecha_fin = $2, anio = $3, activo = true, updated_at = NOW()
               WHERE id = $4::uuid`,
              fechaInicioDef,
              fechaFinDef,
              anio,
              existing[0].id,
            );
            this.logger.log(`[${slug}] anio_escolar_config actualizado (id=${existing[0].id})`);
          }
          anioConfig = { id: existing[0].id, fecha_inicio: fechaInicioDef, fecha_fin: fechaFinDef };
        } else {
          // Create a new anio_escolar_config
          const created = await this.prisma.$queryRawUnsafe<any[]>(
            `INSERT INTO "${slug}".anio_escolar_config (anio, fecha_inicio, fecha_fin, activo)
             VALUES ($1, $2, $3, true) RETURNING id`,
            anio,
            fechaInicioDef,
            fechaFinDef,
          );
          anioConfig = { id: created[0].id, fecha_inicio: fechaInicioDef, fecha_fin: fechaFinDef };
          this.logger.log(`[${slug}] anio_escolar_config creado (anio=${anio})`);
        }
      } catch (e) {
        this.logger.error(`[${slug}] Error al upsertear anio_escolar_config: ${e.message}`);
        throw new Error(`Error configurando el año escolar: ${e.message}`);
      }

      if (anioConfig && (hasNivelesData || hasRegimenData)) {
        const currentNiveles: string[] = (tenant as any).regimen_config?.map((rc: any) => rc.nivel) || [];
        const nivelesSeleccionados = dto.niveles || currentNiveles;
        const newNiveles = nivelesSeleccionados.filter((n: string) => !currentNiveles.includes(n));

        this.logger.log(`[${slug}] currentNiveles=${JSON.stringify(currentNiveles)}, new=${JSON.stringify(newNiveles)}`);

        const regimenMap: Record<string, string | undefined> = {
          PRIMARIA: dto.regimenPrimaria,
          SECUNDARIA: dto.regimenSecundaria,
          INICIAL: dto.regimenInicial,
        };

        // 1. Upsert regimen_config for all selected levels
        for (const nivel of nivelesSeleccionados) {
          const isNew = newNiveles.includes(nivel);
          const regimen = regimenMap[nivel] || (isNew ? 'BIMESTRAL' : undefined);

          if (regimen) {
            try {
              await this.prisma.$executeRawUnsafe(
                `INSERT INTO "${slug}".regimen_config (anio_escolar_id, nivel, tipo_regimen)
                 VALUES ($1::uuid, $2::public.nivel_educativo, $3::text::"${slug}".tipo_regimen)
                 ON CONFLICT (anio_escolar_id, nivel)
                 DO UPDATE SET tipo_regimen = EXCLUDED.tipo_regimen`,
                anioConfig.id,
                nivel,
                regimen,
              );
              this.logger.log(`[${slug}] regimen_config OK: ${nivel}=${regimen}`);
            } catch (e) {
              this.logger.error(`[${slug}] Error en regimen_config para ${nivel}: ${e.message}`);
              throw new Error(`Error al configurar el nivel ${nivel}: ${e.message}`);
            }
          }
        }

        // 2. Initialize new levels (periods + base data)
        if (newNiveles.length > 0) {
          this.logger.log(`[${slug}] Inicializando nuevos niveles: ${newNiveles.join(', ')}`);
          try {
            await this.periodosService.generarPeriodos(
              slug, anioConfig.id,
              new Date(anioConfig.fecha_inicio),
              new Date(anioConfig.fecha_fin),
              newNiveles, regimenMap,
            );
            await this.tenantSeed.seedTenantBase(slug, anioConfig.id, newNiveles);
          } catch (e) {
            this.logger.error(`[${slug}] Error inicializando periodos/base: ${e.message}`);
            throw new Error(`Error al inicializar datos para los nuevos niveles: ${e.message}`);
          }
        }
      }
    }

    return this.findOne(id);
  }

  async updateStatus(id: string, activo: boolean) {
    await this.findOne(id);
    return this.prisma.tenant.update({
      where: { id },
      data: { activo },
    });
  }

  async getStats(id: string) {
    const tenant = await this.findOne(id);
    const slug = tenant.slug;

    let totalEstudiantes = 0;
    try {
      const result = await this.prisma.$queryRawUnsafe<Array<{ count: string }>>(
        `SELECT COUNT(*) as count FROM "${slug}".estudiantes WHERE deleted_at IS NULL`,
      );
      totalEstudiantes = parseInt(result[0]?.count ?? '0', 10);
    } catch {
      totalEstudiantes = 0;
    }

    const totalUsuarios = await this.prisma.usuario.count({
      where: { tenant_id: id, deleted_at: null },
    });

    const ultimoAcceso = await this.prisma.usuario.findFirst({
      where: { tenant_id: id, deleted_at: null },
      orderBy: { updated_at: 'desc' },
      select: { updated_at: true },
    });

    return {
      estudiantes: totalEstudiantes,
      usuarios: totalUsuarios,
      ultimoAcceso: ultimoAcceso?.updated_at ?? null,
    };
  }

  private generateSlug(nombreCorto: string): string {
    return nombreCorto
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_');
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
