import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { request } from 'node:http';
import { createStaticServer } from './server.js';

test('servidor estático: tipos MIME, HEAD, rutas privadas y escape de raíz', async (t) => {
  const temporary = await mkdtemp(join(tmpdir(), 'cuento-servidor-'));
  const root = join(temporary, 'public');
  await mkdir(root);
  await mkdir(join(root, '.git'));
  await mkdir(join(root, 'node_modules'));
  await writeFile(join(root, 'index.html'), '<h1>Cuento</h1>');
  await writeFile(join(root, 'app.js'), 'export const cuento = true;');
  await writeFile(join(root, '.secret'), 'privado');
  await writeFile(join(root, '.git', 'config'), 'privado');
  await writeFile(join(root, 'node_modules', 'package.json'), '{}');
  await writeFile(join(temporary, 'outside.txt'), 'privado');
  await symlink(join(temporary, 'outside.txt'), join(root, 'outside.txt'));
  await symlink(join(root, '.secret'), join(root, 'alias.txt'));
  const server = createStaticServer({ root });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(temporary, { recursive: true, force: true });
  });
  const port = server.address().port;
  const get = (path, method = 'GET') => new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, path, method }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks).toString() }));
    });
    req.on('error', reject);
    req.end();
  });
  const index = await get('/?vista=cuento');
  assert.equal(index.status, 200);
  assert.match(index.headers['content-type'], /text\/html/);
  assert.match(index.body, /Cuento/);
  assert.equal((await get('/app.js')).headers['content-type'], 'text/javascript; charset=utf-8');
  assert.equal((await get('/app.js', 'HEAD')).body, '');
  for (const path of ['/.secret', '/.git/config', '/%2egit/config', '/node_modules/package.json', '/%2e%2e/outside.txt', '/outside.txt', '/alias.txt']) {
    assert.equal((await get(path)).status, 403, path);
  }
  assert.equal((await get('/missing')).status, 404);
  assert.equal((await get('/%zz')).status, 400);
  assert.equal((await get('/', 'POST')).status, 405);
});
