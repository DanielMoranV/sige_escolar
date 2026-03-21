import { PrismaClient } from '@prisma/client';
import { seedAreasCneb } from './areas-cneb';
import { seedCompetenciasCneb } from './competencias-cneb';
import { seedFeriados } from './feriados-nacionales';
import { seedSuperAdmin } from './superadmin';
import { seedUbigeos } from './ubigeos';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Ejecutando seeds...');
  await seedUbigeos(prisma);
  await seedAreasCneb(prisma);
  await seedCompetenciasCneb(prisma);
  await seedFeriados(prisma);
  await seedSuperAdmin(prisma);
  console.log('✅ Seeds completados');
}

main()
  .catch((e) => {
    console.error('❌ Error en seeds:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
