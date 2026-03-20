import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export async function seedSuperAdmin(prisma: PrismaClient) {
  console.log('  Seeding superadmin...');

  const existente = await prisma.usuario.findFirst({
    where: { rol: 'SUPER_ADMIN' },
  });

  if (existente) {
    console.log('  ✓ Superadmin ya existe — seed omitido');
    return;
  }

  const password = process.env.SEED_SUPERADMIN_PASSWORD ?? 'Cambiar1234!';
  const email = process.env.SEED_SUPERADMIN_EMAIL ?? 'admin@sige.edu.pe';
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.usuario.create({
    data: {
      email,
      password_hash: passwordHash,
      rol: 'SUPER_ADMIN',
      nombres: 'Super',
      apellidos: 'Admin',
      activo: true,
      tenant_id: null,
    },
  });

  console.log('  ✓ Superadmin creado');
  console.log(`    Email:    ${email}`);
  console.log(`    Password: ${password}`);
  console.log('    ⚠  Cambia la contraseña en el primer login');
}
