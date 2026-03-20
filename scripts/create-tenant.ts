import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

function generarSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 63);
}

function pregunta(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('\n🏫 Crear nuevo colegio (tenant)\n');

  const nombre = await pregunta(rl, 'Nombre del colegio: ');
  const slug = generarSlug(nombre);
  console.log(`  Slug generado: ${slug}`);

  const confirmar = await pregunta(rl, `¿Confirmar slug "${slug}"? (s/n): `);

  if (confirmar.toLowerCase() !== 's') {
    console.log('Operación cancelada.');
    rl.close();
    return;
  }

  rl.close();

  console.log('\nCreando tenant...');

  // 1. Crear el tenant en public.tenants
  const tenant = await prisma.tenant.create({
    data: {
      slug,
      nombre,
      nombre_corto: nombre.slice(0, 80),
      schema_name: slug,
      plan: 'basico',
      activo: true,
    },
  });

  // 2. Crear el schema de PostgreSQL
  await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${slug}"`);

  console.log(`✅ Tenant creado:`);
  console.log(`   ID:     ${tenant.id}`);
  console.log(`   Slug:   ${tenant.slug}`);
  console.log(`   Schema: ${tenant.schema_name}`);
  console.log('\n⚠  Recuerda completar los datos MINEDU y crear el usuario director desde el panel admin.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
