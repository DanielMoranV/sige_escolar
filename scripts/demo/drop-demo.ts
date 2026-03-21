/**
 * Elimina completamente el tenant demo_primaria
 * Uso: npm run demo:drop
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SLUG = 'demo_primaria';

async function main() {
  console.log(`\n🗑️   Eliminando tenant "${SLUG}"...\n`);

  const tenant = await prisma.tenant.findFirst({ where: { slug: SLUG } });
  if (!tenant) {
    console.log(`  ⚠  El tenant "${SLUG}" no existe. Nada que eliminar.`);
    return;
  }

  // 1. Eliminar schema PostgreSQL (CASCADE elimina todas las tablas)
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${SLUG}" CASCADE`);
  console.log('  ✓ Schema eliminado');

  // 2. Eliminar usuarios del tenant
  const { count } = await prisma.usuario.deleteMany({ where: { tenant_id: tenant.id } });
  console.log(`  ✓ ${count} usuarios eliminados`);

  // 3. Eliminar datos MINEDU
  await prisma.tenantDatosMinedu.deleteMany({ where: { tenant_id: tenant.id } });
  await prisma.tenantPdfConfig.deleteMany({ where: { tenant_id: tenant.id } });

  // 4. Eliminar tenant
  await prisma.tenant.delete({ where: { id: tenant.id } });
  console.log(`  ✓ Tenant "${SLUG}" eliminado`);

  console.log('\n✅  Demo eliminado correctamente.\n');
}

main()
  .catch((e) => { console.error('❌  Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
