import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

/** Parsea una línea CSV respetando campos entre comillas (ej: "29,171") */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export async function seedUbigeos(prisma: PrismaClient) {
  const count = await prisma.ubigeo.count();
  if (count > 0) {
    console.log(`  ⏭  Ubigeos ya cargados (${count} registros). Saltando.`);
    return;
  }

  const csvPath = path.join(__dirname, '../../docs/geodir-ubigeo-reniec.csv');
  const lines = fs.readFileSync(csvPath, 'utf-8').split('\n').slice(1); // omitir header

  const departments = new Map<string, string>();           // código → nombre depto
  const provinces   = new Map<string, { depto: string; prov: string }>();
  const districts: { codigo: string; departamento: string; provincia: string; distrito: string; nivel: string }[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [codigo, distrito, provincia, departamento] = parseCSVLine(trimmed);
    if (!codigo || codigo.length !== 6) continue;

    const deptCode = codigo.substring(0, 2) + '0000';
    const provCode = codigo.substring(0, 4) + '00';

    departments.set(deptCode, departamento);
    provinces.set(provCode, { depto: departamento, prov: provincia });
    districts.push({ codigo, departamento, provincia, distrito, nivel: 'DISTRITO' });
  }

  const data = [
    ...Array.from(departments.entries()).map(([codigo, departamento]) => ({
      codigo,
      departamento,
      provincia: null,
      distrito:  null,
      nivel:     'DEPARTAMENTO',
    })),
    ...Array.from(provinces.entries()).map(([codigo, { depto, prov }]) => ({
      codigo,
      departamento: depto,
      provincia:    prov,
      distrito:     null,
      nivel:        'PROVINCIA',
    })),
    ...districts,
  ];

  await prisma.ubigeo.createMany({ data, skipDuplicates: true });
  console.log(`  ✅ ${data.length} ubigeos cargados (${departments.size} deptos, ${provinces.size} provincias, ${districts.length} distritos).`);
}
