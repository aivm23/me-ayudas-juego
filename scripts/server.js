import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { resolve, relative, extname, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('../', import.meta.url));
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
};

function forbidden(parts) {
  return parts.some((part) => part.startsWith('.') || part === 'node_modules');
}

function respond(response, code, message) {
  response.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(message);
}

/** Servidor de desarrollo sin dependencias; nunca expone archivos ocultos. */
export function createStaticServer({ root = REPO_ROOT } = {}) {
  const rootPath = resolve(root);
  return createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'no-store');
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.setHeader('Allow', 'GET, HEAD');
      respond(response, 405, 'Método no permitido');
      return;
    }

    try {
      const pathname = decodeURIComponent(request.url.split('?')[0]);
      const parts = pathname.replaceAll('\\', '/').split('/').filter(Boolean);
      if (!pathname.startsWith('/') || forbidden(parts) || pathname.includes('\0')) {
        respond(response, 403, 'Acceso denegado');
        return;
      }
      let target = resolve(rootPath, ...parts);
      let info = await stat(target);
      if (info.isDirectory()) {
        target = resolve(target, 'index.html');
        info = await stat(target);
      }
      const canonicalRoot = await realpath(rootPath);
      const canonicalTarget = await realpath(target);
      const inside = relative(canonicalRoot, canonicalTarget);
      if (inside.startsWith(`..${sep}`) || inside === '..' || forbidden(inside.split(sep))) {
        respond(response, 403, 'Acceso denegado');
        return;
      }
      if (!info.isFile()) {
        respond(response, 404, 'Archivo no encontrado');
        return;
      }
      response.writeHead(200, {
        'Content-Type': MIME[extname(target).toLowerCase()] || 'application/octet-stream',
        'Content-Length': info.size,
      });
      if (request.method === 'HEAD') response.end();
      else createReadStream(canonicalTarget).on('error', () => response.destroy()).pipe(response);
    } catch (error) {
      if (error instanceof URIError) respond(response, 400, 'URL incorrecta');
      else if (['ENOENT', 'ENOTDIR'].includes(error.code)) respond(response, 404, 'Archivo no encontrado');
      else respond(response, 500, 'No se pudo servir el archivo');
    }
  });
}

function readArguments(args) {
  let host = '127.0.0.1';
  let port = 4173;
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    if (!['--host', '--port'].includes(key) || !args[index + 1]) {
      throw new Error('Uso: node scripts/server.js [--host 127.0.0.1] [--port 4173]');
    }
    const value = args[++index];
    if (key === '--host') host = value;
    else port = Number(value);
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Puerto inválido');
  return { host, port };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { host, port } = readArguments(process.argv.slice(2));
    const server = createStaticServer();
    server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
    server.listen(port, host, () => console.log(`Cuento disponible en http://${host}:${port}`));
    for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
