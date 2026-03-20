import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Buscando esquemas personalizados para eliminar...');
  
  const schemas = await prisma.$queryRaw<Array<{ schema_name: string }>>`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'public', 'pg_toast')
  `;

  console.log(`Encontrados ${schemas.length} esquemas: ${schemas.map(s => s.schema_name).join(', ')}`);

  for (const { schema_name } of schemas) {
    console.log(`🔥 Eliminando esquema: ${schema_name}...`);
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema_name}" CASCADE`);
  }

  console.log('✅ Todos los esquemas personalizados han sido eliminados.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
