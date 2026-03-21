/**
 * Elimina y recrea el tenant demo_primaria desde cero
 * Uso: npm run demo:reset
 */
import { execSync } from 'child_process';
import * as path from 'path';

const root = path.resolve(__dirname, '../..');
const tsNode = `npx ts-node -r tsconfig-paths/register`;

console.log('\n🔄  Reseteando tenant demo...\n');

try {
  execSync(`${tsNode} scripts/demo/drop-demo.ts`, { cwd: root, stdio: 'inherit' });
  execSync(`${tsNode} scripts/demo/seed-demo.ts`, { cwd: root, stdio: 'inherit' });
} catch (e) {
  process.exit(1);
}
