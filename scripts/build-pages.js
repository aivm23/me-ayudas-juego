import { cp, mkdir, rm, access } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve('_site');
await rm(output, { recursive: true, force: true });
await mkdir(output);
for (const entry of ['index.html', 'styles.css', 'src']) {
  await cp(resolve(entry), resolve(output, entry), { recursive: true });
}
try {
  await access('assets');
  await cp(resolve('assets'), resolve(output, 'assets'), { recursive: true });
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
console.log('Sitio estático preparado en _site/ (solo archivos del juego).');
