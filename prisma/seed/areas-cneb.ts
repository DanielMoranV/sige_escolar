import { PrismaClient } from '@prisma/client';

export async function seedAreasCneb(prisma: PrismaClient) {
  console.log('  Seeding areas_cneb...');

  const areas = [
    // PRIMARIA (8 áreas)
    { codigo: 'COM_P', nombre: 'Comunicación', nivel: 'PRIMARIA' as const, orden: 1, permite_exoneracion: false, es_calificable: true },
    { codigo: 'MAT_P', nombre: 'Matemática', nivel: 'PRIMARIA' as const, orden: 2, permite_exoneracion: false, es_calificable: true },
    { codigo: 'PS_P', nombre: 'Personal Social', nivel: 'PRIMARIA' as const, orden: 3, permite_exoneracion: false, es_calificable: true },
    { codigo: 'CYT_P', nombre: 'Ciencia y Tecnología', nivel: 'PRIMARIA' as const, orden: 4, permite_exoneracion: false, es_calificable: true },
    { codigo: 'AYC_P', nombre: 'Arte y Cultura', nivel: 'PRIMARIA' as const, orden: 5, permite_exoneracion: false, es_calificable: true },
    { codigo: 'EF_P', nombre: 'Educación Física', nivel: 'PRIMARIA' as const, orden: 6, permite_exoneracion: true, es_calificable: true },
    { codigo: 'ER_P', nombre: 'Educación Religiosa', nivel: 'PRIMARIA' as const, orden: 7, permite_exoneracion: true, es_calificable: true },
    { codigo: 'TOE_P', nombre: 'Tutoría y Orientación Educativa', nivel: 'PRIMARIA' as const, orden: 8, permite_exoneracion: false, es_calificable: false },
    // INICIAL (4 áreas)
    { codigo: 'COM_I', nombre: 'Comunicación', nivel: 'INICIAL' as const, orden: 1, permite_exoneracion: false, es_calificable: true },
    { codigo: 'MAT_I', nombre: 'Matemática', nivel: 'INICIAL' as const, orden: 2, permite_exoneracion: false, es_calificable: true },
    { codigo: 'PS_I', nombre: 'Personal Social', nivel: 'INICIAL' as const, orden: 3, permite_exoneracion: false, es_calificable: true },
    { codigo: 'CYT_I', nombre: 'Ciencia y Tecnología', nivel: 'INICIAL' as const, orden: 4, permite_exoneracion: false, es_calificable: true },
    // SECUNDARIA (11 áreas)
    { codigo: 'COM_S', nombre: 'Comunicación', nivel: 'SECUNDARIA' as const, orden: 1, permite_exoneracion: false, es_calificable: true },
    { codigo: 'ING_S', nombre: 'Inglés', nivel: 'SECUNDARIA' as const, orden: 2, permite_exoneracion: false, es_calificable: true },
    { codigo: 'MAT_S', nombre: 'Matemática', nivel: 'SECUNDARIA' as const, orden: 3, permite_exoneracion: false, es_calificable: true },
    { codigo: 'CS_S', nombre: 'Ciencias Sociales', nivel: 'SECUNDARIA' as const, orden: 4, permite_exoneracion: false, es_calificable: true },
    { codigo: 'DPCC_S', nombre: 'Desarrollo Personal, Ciudadanía y Cívica', nivel: 'SECUNDARIA' as const, orden: 5, permite_exoneracion: false, es_calificable: true },
    { codigo: 'CYT_S', nombre: 'Ciencia y Tecnología', nivel: 'SECUNDARIA' as const, orden: 6, permite_exoneracion: false, es_calificable: true },
    { codigo: 'EPT_S', nombre: 'Educación para el Trabajo', nivel: 'SECUNDARIA' as const, orden: 7, permite_exoneracion: false, es_calificable: true },
    { codigo: 'AYC_S', nombre: 'Arte y Cultura', nivel: 'SECUNDARIA' as const, orden: 8, permite_exoneracion: false, es_calificable: true },
    { codigo: 'EF_S', nombre: 'Educación Física', nivel: 'SECUNDARIA' as const, orden: 9, permite_exoneracion: true, es_calificable: true },
    { codigo: 'ER_S', nombre: 'Educación Religiosa', nivel: 'SECUNDARIA' as const, orden: 10, permite_exoneracion: true, es_calificable: true },
    { codigo: 'TOE_S', nombre: 'Tutoría y Orientación Educativa', nivel: 'SECUNDARIA' as const, orden: 11, permite_exoneracion: false, es_calificable: false },
  ];

  for (const area of areas) {
    await prisma.areaCneb.upsert({
      where: { codigo: area.codigo },
      update: area,
      create: area,
    });
  }

  console.log(`  ✓ ${areas.length} áreas CNEB cargadas`);
}
