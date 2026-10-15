import { readdir, readFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

async function javascriptIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return javascriptIn(path);
    return entry.isFile() && entry.name.endsWith('.js') ? [path] : [];
  }));
  return groups.flat();
}

const files = ['playwright.config.js', ...(await Promise.all(['src', 'scripts', 'tests'].map(javascriptIn))).flat()];
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

let resources = 0;
async function checkReferences(file, pattern) {
  const content = await readFile(file, 'utf8');
  for (const match of content.matchAll(pattern)) {
    const reference = match[1].trim();
    if (reference.startsWith('#') || reference.startsWith('data:')) continue;
    if (/^[a-z][a-z\d+.-]*:/i.test(reference) || reference.startsWith('/')) {
      throw new Error(`${file}: el recurso debe ser local y relativo: ${reference}`);
    }
    const target = fileURLToPath(new URL(reference, pathToFileURL(resolve(file))));
    try {
      await access(target);
    } catch {
      throw new Error(`${file}: falta el recurso ${reference}`);
    }
    resources += 1;
  }
}

await checkReferences('index.html', /(?:src|href)=["']([^"']+)["']/g);
await checkReferences('styles.css', /url\(\s*["']?([^"')]+)["']?\s*\)/g);
for (const file of await javascriptIn('src')) {
  await checkReferences(file, /(?:from\s*|import\s*)["']([^"']+)["']/g);
}
console.log(`Sintaxis correcta: ${files.length} archivos JavaScript. Recursos locales comprobados: ${resources}.`);
