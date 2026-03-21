/**
 * Crea el tenant de demo "I.E. 00001 San José - Demo Primaria"
 * Slug: demo_primaria
 *
 * Uso: npm run demo:seed
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const SLUG = 'demo_primaria';

// ── Helpers ───────────────────────────────────────────────────────────────────

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

async function applyTenantSchema(slug: string) {
  const sqlPath = path.resolve(__dirname, '../../prisma/tenant-schema.sql');
  const raw = fs.readFileSync(sqlPath, 'utf-8');
  const statements = raw
    .split(/;\s*(?:\r\n|\n|\r|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.split('\n').every((l) => l.trim().startsWith('--')))
    .map((s) => s.replace(/\{SCHEMA\}/g, slug));

  const SKIP_CODES = new Set(['42710', '42P07', '42723', '42701']);
  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(stmt.endsWith(';') ? stmt : `${stmt};`);
    } catch (e: any) {
      const code = e?.meta?.code ?? e?.code;
      if (!SKIP_CODES.has(code)) throw e;
    }
  }
}

interface Periodo { codigo: string; nombre: string; orden: number; inicio: Date; fin: Date; }

function calcularPeriodosBimestral(anioId: string, inicio: Date, fin: Date): Periodo[] {
  const totalMs = fin.getTime() - inicio.getTime();
  const periodoMs = Math.floor(totalMs / 4);
  const periodos: Periodo[] = [];
  for (let i = 1; i <= 4; i++) {
    const pInicio = new Date(inicio.getTime() + periodoMs * (i - 1));
    const pFin = i === 4 ? fin : new Date(inicio.getTime() + periodoMs * i - 86400000);
    const ordinal = ['Primer', 'Segundo', 'Tercer', 'Cuarto'][i - 1];
    periodos.push({ codigo: `B${i}`, nombre: `${ordinal} Bimestre`, orden: i, inicio: pInicio, fin: pFin });
  }
  // Recuperación y Anual
  periodos.push({
    codigo: 'REC', nombre: 'Período de Recuperación', orden: 5,
    inicio: new Date(fin.getTime() + 7 * 86400000),
    fin: new Date(fin.getTime() + 21 * 86400000),
  });
  periodos.push({ codigo: 'ANUAL', nombre: 'Período Anual', orden: 6, inicio, fin });
  return periodos;
}

// ── Datos del demo ────────────────────────────────────────────────────────────

const FECHA_INICIO = new Date('2026-03-01');
const FECHA_FIN    = new Date('2026-12-15');

const DOCENTES = [
  { nombres: 'Ana María',    apellidos: 'García López',     email: 'docente1@demo.sige', dni: '99001001' },
  { nombres: 'Luis Eduardo', apellidos: 'Martínez Soto',    email: 'docente2@demo.sige', dni: '99001002' },
  { nombres: 'María Elena',  apellidos: 'Rodríguez Díaz',   email: 'docente3@demo.sige', dni: '99001003' },
  { nombres: 'Juan Carlos',  apellidos: 'Flores Vega',      email: 'docente4@demo.sige', dni: '99001004' },
  { nombres: 'Rosa Amelia',  apellidos: 'Quispe Mamani',    email: 'docente5@demo.sige', dni: '99001005' },
  { nombres: 'Pedro Hugo',   apellidos: 'Huanca Torres',    email: 'docente6@demo.sige', dni: '99001006' },
];

// 5 estudiantes por grado (30 total) - datos verosímiles
const ESTUDIANTES_POR_GRADO: Record<number, Array<{ nombres: string; ap: string; am: string; dni: string; fnac: string; genero: 'M' | 'F' }>> = {
  1: [
    { nombres: 'Valentina',  ap: 'Castillo',   am: 'Ruiz',     dni: '11000001', fnac: '2019-04-12', genero: 'F' },
    { nombres: 'Mateo',      ap: 'Torres',     am: 'Vargas',   dni: '11000002', fnac: '2019-07-23', genero: 'M' },
    { nombres: 'Luciana',    ap: 'Mendoza',    am: 'Peña',     dni: '11000003', fnac: '2019-02-08', genero: 'F' },
    { nombres: 'Sebastián',  ap: 'Ramos',      am: 'Cruz',     dni: '11000004', fnac: '2019-11-15', genero: 'M' },
    { nombres: 'Isabella',   ap: 'Herrera',    am: 'Salinas',  dni: '11000005', fnac: '2019-06-30', genero: 'F' },
  ],
  2: [
    { nombres: 'Diego',      ap: 'Morales',    am: 'León',     dni: '11000006', fnac: '2018-03-17', genero: 'M' },
    { nombres: 'Camila',     ap: 'Sánchez',    am: 'Medina',   dni: '11000007', fnac: '2018-09-05', genero: 'F' },
    { nombres: 'Alejandro',  ap: 'Rojas',      am: 'Paredes',  dni: '11000008', fnac: '2018-01-22', genero: 'M' },
    { nombres: 'Sofía',      ap: 'Delgado',    am: 'Ortega',   dni: '11000009', fnac: '2018-08-14', genero: 'F' },
    { nombres: 'Gabriel',    ap: 'Vásquez',    am: 'Reyes',    dni: '11000010', fnac: '2018-12-01', genero: 'M' },
  ],
  3: [
    { nombres: 'Valeria',    ap: 'Chávez',     am: 'Quispe',   dni: '11000011', fnac: '2017-05-19', genero: 'F' },
    { nombres: 'Nicolás',    ap: 'Mamani',     am: 'Huanca',   dni: '11000012', fnac: '2017-10-07', genero: 'M' },
    { nombres: 'Paula',      ap: 'Condori',    am: 'Apaza',    dni: '11000013', fnac: '2017-03-28', genero: 'F' },
    { nombres: 'Rodrigo',    ap: 'Ccopa',      am: 'Turpo',    dni: '11000014', fnac: '2017-07-11', genero: 'M' },
    { nombres: 'Andrea',     ap: 'Lazo',       am: 'Ponce',    dni: '11000015', fnac: '2017-11-25', genero: 'F' },
  ],
  4: [
    { nombres: 'Emilio',     ap: 'Gutiérrez',  am: 'Lara',     dni: '11000016', fnac: '2016-02-14', genero: 'M' },
    { nombres: 'Fernanda',   ap: 'Alvarado',   am: 'Nieto',    dni: '11000017', fnac: '2016-06-09', genero: 'F' },
    { nombres: 'Joaquín',    ap: 'Espinoza',   am: 'Cáceres',  dni: '11000018', fnac: '2016-09-21', genero: 'M' },
    { nombres: 'Daniela',    ap: 'Palomino',   am: 'Tapia',    dni: '11000019', fnac: '2016-04-03', genero: 'F' },
    { nombres: 'Martín',     ap: 'Cárdenas',   am: 'Ibáñez',   dni: '11000020', fnac: '2016-12-18', genero: 'M' },
  ],
  5: [
    { nombres: 'Renata',     ap: 'Fuentes',    am: 'Bravo',    dni: '11000021', fnac: '2015-01-27', genero: 'F' },
    { nombres: 'Bruno',      ap: 'Meza',       am: 'Vera',     dni: '11000022', fnac: '2015-08-16', genero: 'M' },
    { nombres: 'Ximena',     ap: 'Salas',      am: 'Campos',   dni: '11000023', fnac: '2015-05-04', genero: 'F' },
    { nombres: 'Ignacio',    ap: 'Pedraza',    am: 'Montes',   dni: '11000024', fnac: '2015-10-31', genero: 'M' },
    { nombres: 'Mariana',    ap: 'Contreras',  am: 'Serrano',  dni: '11000025', fnac: '2015-03-12', genero: 'F' },
  ],
  6: [
    { nombres: 'Tomás',      ap: 'Aguilar',    am: 'Miranda',  dni: '11000026', fnac: '2014-06-08', genero: 'M' },
    { nombres: 'Natalia',    ap: 'Benavides',  am: 'Cortez',   dni: '11000027', fnac: '2014-11-20', genero: 'F' },
    { nombres: 'Maximiliano',ap: 'Osorio',     am: 'Fajardo',  dni: '11000028', fnac: '2014-04-15', genero: 'M' },
    { nombres: 'Catalina',   ap: 'Sandoval',   am: 'Guerrero', dni: '11000029', fnac: '2014-08-29', genero: 'F' },
    { nombres: 'Alonso',     ap: 'Villanueva', am: 'Noriega',  dni: '11000030', fnac: '2014-01-06', genero: 'M' },
  ],
};

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🏫  Creando tenant demo: demo_primaria\n');

  // 0. Verificar que no exista ya
  const existing = await prisma.tenant.findFirst({ where: { slug: SLUG } });
  if (existing) {
    console.error(`❌  El tenant "${SLUG}" ya existe. Usa "npm run demo:reset" para recrearlo.`);
    process.exit(1);
  }

  // 1. Tenant
  const tenant = await prisma.tenant.create({
    data: {
      slug: SLUG,
      nombre: 'I.E. 00001 San José - Demo',
      nombre_corto: 'San José Demo',
      schema_name: SLUG,
      plan: 'profesional',
      activo: true,
    },
  });
  console.log(`  ✓ Tenant creado  (id: ${tenant.id})`);

  // 2. Datos MINEDU
  await prisma.tenantDatosMinedu.create({
    data: {
      tenant_id: tenant.id,
      codigo_modular: '0000001',
      nombre_oficial: 'I.E. N° 00001 SAN JOSÉ',
      dre_codigo: '190000',
      dre_nombre: 'DRE San Martín',
      ugel_codigo: '190600',
      ugel_nombre: 'UGEL Mariscal Cáceres',
      tipo_gestion: 'PÚBLICA',
      director_dni: '99000001',
      director_nombres: 'Carlos Alberto',
      director_apellidos: 'Ramírez Torres',
      director_cargo: 'Director(a)',
    },
  });
  console.log('  ✓ Datos MINEDU creados');

  // 3. Usuarios: director + docentes
  const passwordHash = await bcrypt.hash('Demo2026!', 10);

  const director = await prisma.usuario.create({
    data: {
      tenant_id: tenant.id,
      email: 'director@demo.sige',
      password_hash: passwordHash,
      rol: 'DIRECTOR',
      nombres: 'Carlos Alberto',
      apellidos: 'Ramírez Torres',
      dni: '99000001',
      activo: true,
      needs_password_change: false,
    },
  });
  console.log(`  ✓ Director creado  (${director.email})`);

  const docenteUsuarioIds: { usuarioId: string; dni: string; nombres: string; apellidos: string }[] = [];
  for (const d of DOCENTES) {
    const u = await prisma.usuario.create({
      data: {
        tenant_id: tenant.id,
        email: d.email,
        password_hash: passwordHash,
        rol: 'DOCENTE_TUTOR',
        nombres: d.nombres,
        apellidos: d.apellidos,
        activo: true,
        needs_password_change: false,
      },
    });
    docenteUsuarioIds.push({ usuarioId: u.id, dni: d.dni, nombres: d.nombres, apellidos: d.apellidos });
  }
  console.log(`  ✓ ${DOCENTES.length} docentes creados`);

  // 4. Schema PostgreSQL + tablas
  await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${SLUG}"`);
  await applyTenantSchema(SLUG);
  console.log('  ✓ Schema y tablas creados');

  // 5. Año escolar
  const [anioRow] = await prisma.$queryRawUnsafe<any[]>(
    `INSERT INTO "${SLUG}".anio_escolar_config (anio, fecha_inicio, fecha_fin, activo)
     VALUES (2026, '${dateStr(FECHA_INICIO)}', '${dateStr(FECHA_FIN)}', true)
     RETURNING id`,
  );
  const anioId: string = anioRow.id;
  console.log(`  ✓ Año escolar 2026  (id: ${anioId})`);

  // 6. Regimen config — PRIMARIA BIMESTRAL
  await prisma.$executeRawUnsafe(
    `INSERT INTO "${SLUG}".regimen_config (anio_escolar_id, nivel, tipo_regimen)
     VALUES ('${anioId}', 'PRIMARIA'::public.nivel_educativo, 'BIMESTRAL'::"${SLUG}".tipo_regimen)`,
  );
  console.log('  ✓ Régimen: Primaria Bimestral');

  // 7. Periodos
  const periodos = calcularPeriodosBimestral(anioId, FECHA_INICIO, FECHA_FIN);
  for (const p of periodos) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "${SLUG}".periodos (anio_escolar_id, nivel, codigo, nombre, orden, fecha_inicio, fecha_fin, estado)
       VALUES ('${anioId}', 'PRIMARIA'::public.nivel_educativo, '${p.codigo}', '${p.nombre}', ${p.orden},
               '${dateStr(p.inicio)}', '${dateStr(p.fin)}', 'FUTURO'::"${SLUG}".estado_periodo)`,
    );
  }
  console.log(`  ✓ ${periodos.length} períodos creados`);

  // 8. Grados (1° a 6°)
  const gradosData = [
    { numero: 1, nombre: 'Primer Grado',   orden: 1 },
    { numero: 2, nombre: 'Segundo Grado',  orden: 2 },
    { numero: 3, nombre: 'Tercer Grado',   orden: 3 },
    { numero: 4, nombre: 'Cuarto Grado',   orden: 4 },
    { numero: 5, nombre: 'Quinto Grado',   orden: 5 },
    { numero: 6, nombre: 'Sexto Grado',    orden: 6 },
  ];
  for (const g of gradosData) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "${SLUG}".grados (nivel, numero, nombre, orden)
       VALUES ('PRIMARIA'::public.nivel_educativo, ${g.numero}, '${g.nombre}', ${g.orden})
       ON CONFLICT (nivel, numero) DO NOTHING`,
    );
  }
  console.log('  ✓ 6 grados creados');

  // 9. Áreas (desde public.areas_cneb → tenant.areas_ie)
  const areasCneb = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, nombre, codigo, orden, permite_exoneracion, es_calificable FROM public.areas_cneb WHERE nivel = 'PRIMARIA' AND activo = true ORDER BY orden`,
  );
  for (const a of areasCneb) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "${SLUG}".areas_ie
         (anio_escolar_id, area_cneb_id, nombre_display, codigo_display, nivel, es_area_cneb, orden, permite_exoneracion, es_calificable)
       VALUES ('${anioId}', '${a.id}', '${a.nombre}', '${a.codigo}', 'PRIMARIA'::public.nivel_educativo, true, ${a.orden}, ${a.permite_exoneracion}, ${a.es_calificable})
       ON CONFLICT DO NOTHING`,
    );
  }
  console.log(`  ✓ ${areasCneb.length} áreas IE creadas`);

  // 10. Competencias por área
  for (const area of areasCneb) {
    const [areaIe] = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM "${SLUG}".areas_ie WHERE area_cneb_id = '${area.id}' AND anio_escolar_id = '${anioId}'`,
    );
    if (!areaIe) continue;

    const competencias = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, nombre, codigo, orden FROM public.competencias_cneb WHERE area_id = '${area.id}' AND activo = true ORDER BY orden`,
    );
    for (const c of competencias) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "${SLUG}".competencias_ie (area_ie_id, competencia_cneb_id, nombre_display, orden)
         VALUES ('${areaIe.id}', '${c.id}', '${c.nombre}', ${c.orden})
         ON CONFLICT DO NOTHING`,
      );
    }
  }
  console.log('  ✓ Competencias IE creadas');

  // 11. Secciones + asignar docentes tutores
  const gradoRows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, numero FROM "${SLUG}".grados WHERE nivel = 'PRIMARIA' ORDER BY numero`,
  );

  // Insertar registros en docentes (tabla del tenant)
  const docenteTenantIds: string[] = [];
  for (const d of docenteUsuarioIds) {
    const [doc] = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO "${SLUG}".docentes (usuario_id, dni, nombres, apellidos)
       VALUES ('${d.usuarioId}', '${d.dni}', '${d.nombres}', '${d.apellidos}')
       RETURNING id`,
    );
    docenteTenantIds.push(doc.id);
  }

  const seccionIds: string[] = [];
  for (let i = 0; i < gradoRows.length; i++) {
    const grado = gradoRows[i];
    const [sec] = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO "${SLUG}".secciones (anio_escolar_id, grado_id, nombre, turno)
       VALUES ('${anioId}', '${grado.id}', 'A', 'MAÑANA')
       RETURNING id`,
    );
    seccionIds.push(sec.id);

    // Asignar docente como tutor en todas las áreas de su sección
    const docenteId = docenteTenantIds[i];
    const areas = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM "${SLUG}".areas_ie WHERE anio_escolar_id = '${anioId}' AND nivel = 'PRIMARIA'`,
    );
    for (const area of areas) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "${SLUG}".docente_area_seccion (anio_escolar_id, docente_id, area_ie_id, seccion_id, es_tutor)
         VALUES ('${anioId}', '${docenteId}', '${area.id}', '${sec.id}', true)
         ON CONFLICT DO NOTHING`,
      );
    }
  }
  console.log('  ✓ 6 secciones creadas (1°A a 6°A) con docentes asignados');

  // 12. Estudiantes + Matrículas
  let totalEstudiantes = 0;
  for (let grado = 1; grado <= 6; grado++) {
    const seccionId = seccionIds[grado - 1];
    const estudiantes = ESTUDIANTES_POR_GRADO[grado];

    for (const e of estudiantes) {
      const [est] = await prisma.$queryRawUnsafe<any[]>(
        `INSERT INTO "${SLUG}".estudiantes
           (dni, tipo_documento, numero_documento, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, genero, lengua_materna)
         VALUES ('${e.dni}', 'DNI', '${e.dni}', '${e.nombres}', '${e.ap}', '${e.am}', '${e.fnac}', '${e.genero}', 'CASTELLANO')
         RETURNING id`,
      );

      await prisma.$executeRawUnsafe(
        `INSERT INTO "${SLUG}".matriculas
           (anio_escolar_id, estudiante_id, seccion_id, tipo_matricula, condicion_matricula, estado, fecha_matricula, fecha_inicio)
         VALUES ('${anioId}', '${est.id}', '${seccionId}',
                 'CONTINUIDAD'::"${SLUG}".tipo_matricula,
                 'PROMOVIDO'::"${SLUG}".condicion_matricula,
                 'ACTIVA'::"${SLUG}".estado_matricula,
                 '2026-03-01', '2026-03-01')`,
      );
      totalEstudiantes++;
    }
  }
  console.log(`  ✓ ${totalEstudiantes} estudiantes matriculados`);

  console.log(`
✅  Demo listo.

  Tenant : ${SLUG}
  URL web : http://localhost:5173  (usa el slug "${SLUG}")

  Credenciales (contraseña: Demo2026!):
  ┌─────────────────────────────────┬──────────────────┐
  │ Email                           │ Rol              │
  ├─────────────────────────────────┼──────────────────┤
  │ director@demo.sige              │ Director         │
  │ docente1@demo.sige              │ Docente 1°A      │
  │ docente2@demo.sige              │ Docente 2°A      │
  │ docente3@demo.sige              │ Docente 3°A      │
  │ docente4@demo.sige              │ Docente 4°A      │
  │ docente5@demo.sige              │ Docente 5°A      │
  │ docente6@demo.sige              │ Docente 6°A      │
  └─────────────────────────────────┴──────────────────┘
`);
}

main()
  .catch((e) => { console.error('❌  Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
