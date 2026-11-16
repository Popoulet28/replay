// Assemble l'application web dans app/src/main/assets/www (le dossier que l'APK et le .exe embarquent).
//   node scripts/build.mjs           build de production
//   node scripts/build.mjs --serve   build + petit serveur local (http://localhost:4173), pour le dev et les tests
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const web = path.join(root, 'web');
const out = path.join(root, 'app', 'src', 'main', 'assets', 'www');
const serve = process.argv.includes('--serve');

function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b); else fs.copyFileSync(a, b);
  }
}

export async function build() {
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  await esbuild.build({
    entryPoints: { app: path.join(web, 'src', 'main.js') },
    outdir: out,
    bundle: true,
    // Script classique (pas de type="module") : chargé sans condition de type MIME par la WebView Android.
    format: 'iife',
    target: ['chrome100'],
    charset: 'utf8',
    sourcemap: serve ? 'inline' : false,
    minify: !serve,
    loader: { '.woff2': 'file', '.woff': 'file', '.ttf': 'file' },
    assetNames: 'fonts/[name]',
    logLevel: 'warning',
  });
  await esbuild.build({
    entryPoints: { app: path.join(web, 'src', 'styles.css') },
    outdir: out,
    bundle: true,
    charset: 'utf8',
    minify: !serve,
    loader: { '.woff2': 'file', '.woff': 'file', '.ttf': 'file' },
    assetNames: 'fonts/[name]',
    logLevel: 'warning',
  });
  fs.copyFileSync(path.join(web, 'index.html'), path.join(out, 'index.html'));
  copyDir(path.join(web, 'public'), out);
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };

await build();
if (serve) {
  const port = Number(process.env.PORT) || 4173;
  http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.join(out, rel);
    if (!file.startsWith(out) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('introuvable'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  }).listen(port, () => console.log('Replay : http://localhost:' + port));
} else {
  console.log('Build écrit dans ' + path.relative(root, out));
}
