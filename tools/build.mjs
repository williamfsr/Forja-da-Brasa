// Gera sw.js com a lista de arquivos e uma versão (hash do conteúdo).
// Uso:  node tools/build.mjs            -> grava sw.js na raiz (publicar a raiz do repositório)
//       node tools/build.mjs --out _site -> copia o site pronto para a pasta _site (usado pelo GitHub Actions)
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const INCLUIR = ['index.html', 'manifest.webmanifest', 'css', 'js', 'icons'];
const lista = [];
const anda = (p) => { const s = statSync(p); if (s.isDirectory()) readdirSync(p).sort().forEach((n) => anda(join(p, n))); else lista.push(relative(raiz, p).split('\\').join('/')); };
INCLUIR.forEach((n) => anda(join(raiz, n)));
const h = createHash('sha1'); lista.forEach((f) => { h.update(f); h.update(readFileSync(join(raiz, f))); });
const versao = h.digest('hex').slice(0, 10);
const arquivos = ['./', ...lista.map((f) => './' + f)];
const sw = readFileSync(join(raiz, 'tools', 'sw.template.js'), 'utf8').replace('__VERSAO__', versao).replace('__ARQUIVOS__', JSON.stringify(arquivos, null, 2));
const i = process.argv.indexOf('--out');
if (i > 0) {
  const out = join(raiz, process.argv[i + 1]); rmSync(out, { recursive: true, force: true });
  for (const f of lista) { const d = join(out, f); mkdirSync(dirname(d), { recursive: true }); copyFileSync(join(raiz, f), d); }
  writeFileSync(join(out, 'sw.js'), sw); writeFileSync(join(out, '.nojekyll'), '');
  console.log(`site gerado em ${process.argv[i + 1]} (${lista.length + 1} arquivos, versão ${versao})`);
} else { writeFileSync(join(raiz, 'sw.js'), sw); console.log(`sw.js gerado (${arquivos.length} entradas, versão ${versao})`); }
