import { PrismaClient } from '@prisma/client';

export async function seedCompetenciasCneb(prisma: PrismaClient) {
  console.log('  Seeding competencias_cneb...');

  const competencias = [
    // PRIMARIA — Comunicación (3 competencias)
    { area_codigo: 'COM_P', codigo: 'COM_P_ORAL', nombre: 'Se comunica oralmente en su lengua materna', orden: 1, aplica_grados: [1,2,3,4,5,6] },
    { area_codigo: 'COM_P', codigo: 'COM_P_LECTURA', nombre: 'Lee diversos tipos de textos escritos en su lengua materna', orden: 2, aplica_grados: [1,2,3,4,5,6] },
    { area_codigo: 'COM_P', codigo: 'COM_P_ESCRITURA', nombre: 'Escribe diversos tipos de textos en su lengua materna', orden: 3, aplica_grados: [1,2,3,4,5,6] },
    // PRIMARIA — Matemática (4 competencias)
    { area_codigo: 'MAT_P', codigo: 'MAT_P_CANTIDAD', nombre: 'Resuelve problemas de cantidad', orden: 1, aplica_grados: [1,2,3,4,5,6] },
    { area_codigo: 'MAT_P', codigo: 'MAT_P_REGULARIDAD', nombre: 'Resuelve problemas de regularidad, equivalencia y cambio', orden: 2, aplica_grados: [1,2,3,4,5,6] },
    { area_codigo: 'MAT_P', codigo: 'MAT_P_FORMA', nombre: 'Resuelve problemas de movimiento, forma y localización', orden: 3, aplica_grados: [1,2,3,4,5,6] },
    { area_codigo: 'MAT_P', codigo: 'MAT_P_DATOS', nombre: 'Resuelve problemas de gestión de datos e incertidumbre', orden: 4, aplica_grados: [1,2,3,4,5,6] },
    // PRIMARIA — Personal Social (5 competencias)
    { area_codigo: 'PS_P', codigo: 'PS_P_IDENTIDAD', nombre: 'Construye su identidad', orden: 1, aplica_grados: [1,2,3,4,5,6] },
    { area_codigo: 'PS_P', codigo: 'PS_P_CONVIVENCIA', nombre: 'Convive y participa democráticamente en la búsqueda del bien común', orden: 2, aplica_grados: [1,2,3,4,5,6] },
    { area_codigo: 'PS_P', codigo: 'PS_P_HISTORIA', nombre: 'Construye interpretaciones históricas', orden: 3, aplica_grados: [1,2,3,4,5,6] },
    { area_codigo: 'PS_P', codigo: 'PS_P_ESPACIO', nombre: 'Gestiona responsablemente el espacio y el ambiente', orden: 4, aplica_grados: [1,2,3,4,5,6] },
    { area_codigo: 'PS_P', codigo: 'PS_P_RECURSOS', nombre: 'Gestiona responsablemente los recursos económicos', orden: 5, aplica_grados: [1,2,3,4,5,6] },
    // PRIMARIA — Ciencia y Tecnología (3 competencias)
    { area_codigo: 'CYT_P', codigo: 'CYT_P_INDAGA', nombre: 'Indaga mediante métodos científicos para construir conocimientos', orden: 1, aplica_grados: [1,2,3,4,5,6] },
    { area_codigo: 'CYT_P', codigo: 'CYT_P_EXPLICA', nombre: 'Explica el mundo físico basándose en conocimientos sobre los seres vivos', orden: 2, aplica_grados: [1,2,3,4,5,6] },
    { area_codigo: 'CYT_P', codigo: 'CYT_P_DISEÑA', nombre: 'Diseña y construye soluciones tecnológicas para resolver problemas de su entorno', orden: 3, aplica_grados: [1,2,3,4,5,6] },
    // PRIMARIA — Arte y Cultura (2 competencias)
    { area_codigo: 'AYC_P', codigo: 'AYC_P_APRECIA', nombre: 'Aprecia de manera crítica manifestaciones artístico-culturales', orden: 1, aplica_grados: [1,2,3,4,5,6] },
    { area_codigo: 'AYC_P', codigo: 'AYC_P_CREA', nombre: 'Crea proyectos desde los lenguajes artísticos', orden: 2, aplica_grados: [1,2,3,4,5,6] },
    // PRIMARIA — Educación Física (3 competencias)
    { area_codigo: 'EF_P', codigo: 'EF_P_MOTRICIDAD', nombre: 'Se desenvuelve de manera autónoma a través de su motricidad', orden: 1, aplica_grados: [1,2,3,4,5,6] },
    { area_codigo: 'EF_P', codigo: 'EF_P_SALUDABLE', nombre: 'Asume una vida saludable', orden: 2, aplica_grados: [1,2,3,4,5,6] },
    { area_codigo: 'EF_P', codigo: 'EF_P_SOCIOMOTRIZ', nombre: 'Interactúa a través de sus habilidades sociomotrices', orden: 3, aplica_grados: [1,2,3,4,5,6] },
    // PRIMARIA — Educación Religiosa (2 competencias)
    { area_codigo: 'ER_P', codigo: 'ER_P_IDENTIDAD', nombre: 'Construye su identidad como persona humana, amada por Dios, digna, libre y trascendente', orden: 1, aplica_grados: [1,2,3,4,5,6] },
    { area_codigo: 'ER_P', codigo: 'ER_P_ENCUENTRO', nombre: 'Asume la experiencia del encuentro personal y comunitario con Dios en su proyecto de vida', orden: 2, aplica_grados: [1,2,3,4,5,6] },
    // SECUNDARIA — Comunicación (3 competencias)
    { area_codigo: 'COM_S', codigo: 'COM_S_ORAL', nombre: 'Se comunica oralmente en su lengua materna', orden: 1, aplica_grados: [1,2,3,4,5] },
    { area_codigo: 'COM_S', codigo: 'COM_S_LECTURA', nombre: 'Lee diversos tipos de textos escritos en su lengua materna', orden: 2, aplica_grados: [1,2,3,4,5] },
    { area_codigo: 'COM_S', codigo: 'COM_S_ESCRITURA', nombre: 'Escribe diversos tipos de textos en su lengua materna', orden: 3, aplica_grados: [1,2,3,4,5] },
    // SECUNDARIA — Inglés (3 competencias)
    { area_codigo: 'ING_S', codigo: 'ING_S_ORAL', nombre: 'Se comunica oralmente en inglés como lengua extranjera', orden: 1, aplica_grados: [1,2,3,4,5] },
    { area_codigo: 'ING_S', codigo: 'ING_S_LECTURA', nombre: 'Lee diversos tipos de textos en inglés como lengua extranjera', orden: 2, aplica_grados: [1,2,3,4,5] },
    { area_codigo: 'ING_S', codigo: 'ING_S_ESCRITURA', nombre: 'Escribe diversos tipos de textos en inglés como lengua extranjera', orden: 3, aplica_grados: [1,2,3,4,5] },
    // SECUNDARIA — Matemática (4 competencias)
    { area_codigo: 'MAT_S', codigo: 'MAT_S_CANTIDAD', nombre: 'Resuelve problemas de cantidad', orden: 1, aplica_grados: [1,2,3,4,5] },
    { area_codigo: 'MAT_S', codigo: 'MAT_S_REGULARIDAD', nombre: 'Resuelve problemas de regularidad, equivalencia y cambio', orden: 2, aplica_grados: [1,2,3,4,5] },
    { area_codigo: 'MAT_S', codigo: 'MAT_S_FORMA', nombre: 'Resuelve problemas de movimiento, forma y localización', orden: 3, aplica_grados: [1,2,3,4,5] },
    { area_codigo: 'MAT_S', codigo: 'MAT_S_DATOS', nombre: 'Resuelve problemas de gestión de datos e incertidumbre', orden: 4, aplica_grados: [1,2,3,4,5] },
    // SECUNDARIA — Ciencias Sociales (3 competencias)
    { area_codigo: 'CS_S', codigo: 'CS_S_HISTORIA', nombre: 'Construye interpretaciones históricas', orden: 1, aplica_grados: [1,2,3,4,5] },
    { area_codigo: 'CS_S', codigo: 'CS_S_ESPACIO', nombre: 'Gestiona responsablemente el espacio y el ambiente', orden: 2, aplica_grados: [1,2,3,4,5] },
    { area_codigo: 'CS_S', codigo: 'CS_S_RECURSOS', nombre: 'Gestiona responsablemente los recursos económicos', orden: 3, aplica_grados: [1,2,3,4,5] },
    // SECUNDARIA — DPCC (2 competencias)
    { area_codigo: 'DPCC_S', codigo: 'DPCC_S_IDENTIDAD', nombre: 'Construye su identidad', orden: 1, aplica_grados: [1,2,3,4,5] },
    { area_codigo: 'DPCC_S', codigo: 'DPCC_S_CONVIVENCIA', nombre: 'Convive y participa democráticamente en la búsqueda del bien común', orden: 2, aplica_grados: [1,2,3,4,5] },
    // SECUNDARIA — Ciencia y Tecnología (3 competencias)
    { area_codigo: 'CYT_S', codigo: 'CYT_S_INDAGA', nombre: 'Indaga mediante métodos científicos para construir conocimientos', orden: 1, aplica_grados: [1,2,3,4,5] },
    { area_codigo: 'CYT_S', codigo: 'CYT_S_EXPLICA', nombre: 'Explica el mundo físico basándose en conocimientos sobre los seres vivos', orden: 2, aplica_grados: [1,2,3,4,5] },
    { area_codigo: 'CYT_S', codigo: 'CYT_S_DISEÑA', nombre: 'Diseña y construye soluciones tecnológicas para resolver problemas de su entorno', orden: 3, aplica_grados: [1,2,3,4,5] },
    // SECUNDARIA — EPT (1 competencia)
    { area_codigo: 'EPT_S', codigo: 'EPT_S_EMPRENDIMIENTO', nombre: 'Gestiona proyectos de emprendimiento económico o social', orden: 1, aplica_grados: [1,2,3,4,5] },
    // SECUNDARIA — Arte y Cultura (2 competencias)
    { area_codigo: 'AYC_S', codigo: 'AYC_S_APRECIA', nombre: 'Aprecia de manera crítica manifestaciones artístico-culturales', orden: 1, aplica_grados: [1,2,3,4,5] },
    { area_codigo: 'AYC_S', codigo: 'AYC_S_CREA', nombre: 'Crea proyectos desde los lenguajes artísticos', orden: 2, aplica_grados: [1,2,3,4,5] },
    // SECUNDARIA — Educación Física (3 competencias)
    { area_codigo: 'EF_S', codigo: 'EF_S_MOTRICIDAD', nombre: 'Se desenvuelve de manera autónoma a través de su motricidad', orden: 1, aplica_grados: [1,2,3,4,5] },
    { area_codigo: 'EF_S', codigo: 'EF_S_SALUDABLE', nombre: 'Asume una vida saludable', orden: 2, aplica_grados: [1,2,3,4,5] },
    { area_codigo: 'EF_S', codigo: 'EF_S_SOCIOMOTRIZ', nombre: 'Interactúa a través de sus habilidades sociomotrices', orden: 3, aplica_grados: [1,2,3,4,5] },
    // SECUNDARIA — Educación Religiosa (2 competencias)
    { area_codigo: 'ER_S', codigo: 'ER_S_IDENTIDAD', nombre: 'Construye su identidad como persona humana, amada por Dios, digna, libre y trascendente', orden: 1, aplica_grados: [1,2,3,4,5] },
    { area_codigo: 'ER_S', codigo: 'ER_S_ENCUENTRO', nombre: 'Asume la experiencia del encuentro personal y comunitario con Dios en su proyecto de vida', orden: 2, aplica_grados: [1,2,3,4,5] },
  ];

  for (const comp of competencias) {
    const area = await prisma.areaCneb.findUnique({ where: { codigo: comp.area_codigo } });
    if (!area) {
      console.warn(`    ⚠ Área no encontrada: ${comp.area_codigo}`);
      continue;
    }
    await prisma.competenciaCneb.upsert({
      where: { codigo: comp.codigo },
      update: {
        nombre: comp.nombre,
        orden: comp.orden,
        aplica_grados: comp.aplica_grados,
      },
      create: {
        area_id: area.id,
        codigo: comp.codigo,
        nombre: comp.nombre,
        orden: comp.orden,
        aplica_grados: comp.aplica_grados,
      },
    });
  }

  console.log(`  ✓ ${competencias.length} competencias CNEB cargadas`);
}
