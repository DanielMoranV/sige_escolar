import { PrismaClient } from '@prisma/client';

export async function seedFeriados(prisma: PrismaClient) {
  console.log('  Seeding feriados_nacionales 2026...');

  const feriados2026 = [
    { fecha: '2026-01-01', nombre: "Año Nuevo" },
    { fecha: '2026-04-02', nombre: "Jueves Santo" },
    { fecha: '2026-04-03', nombre: "Viernes Santo" },
    { fecha: '2026-05-01', nombre: "Día del Trabajo" },
    { fecha: '2026-06-07', nombre: "Batalla de Arica" },
    { fecha: '2026-06-29', nombre: "San Pedro y San Pablo" },
    { fecha: '2026-07-28', nombre: "Fiestas Patrias - Día 1" },
    { fecha: '2026-07-29', nombre: "Fiestas Patrias - Día 2" },
    { fecha: '2026-08-06', nombre: "Batalla de Junín" },
    { fecha: '2026-08-30', nombre: "Santa Rosa de Lima" },
    { fecha: '2026-10-08', nombre: "Combate de Angamos" },
    { fecha: '2026-11-01', nombre: "Todos los Santos" },
    { fecha: '2026-12-08', nombre: "Inmaculada Concepción" },
    { fecha: '2026-12-09', nombre: "Batalla de Ayacucho" },
    { fecha: '2026-12-25', nombre: "Navidad" },
  ];

  for (const f of feriados2026) {
    await prisma.feriadoNacional.upsert({
      where: { fecha: new Date(f.fecha) },
      update: { nombre: f.nombre },
      create: {
        fecha: new Date(f.fecha),
        nombre: f.nombre,
        anio: 2026,
        obligatorio: true,
      },
    });
  }

  console.log(`  ✓ ${feriados2026.length} feriados 2026 cargados`);
}
