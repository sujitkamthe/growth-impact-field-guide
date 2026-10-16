// Deploy step (.github/workflows/deploy.yml): stamps a build id into V2 so that, after a deploy,
// browsers fetch the files that changed instead of reusing cached copies. It adds ?v=<id> to
// index.html's stylesheets and entry script and to every relative import in v2/js (static, and
// dynamic with a quoted path), and sets <meta name="v2-build"> for the URLs built at runtime
// (js/build.js). Every relative import gets the same id, so no module loads under two URLs.
// Runs on the CI checkout only; locally the site runs unstamped.
//
// usage: node v2/scripts/stamp-build.mjs <id>
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const id = process.argv[2];
if (!id || !/^[\w.-]+$/.test(id)) { console.error('usage: stamp-build.mjs <id>'); process.exit(1); }
const V2 = join(dirname(fileURLToPath(import.meta.url)), '..');

// from './x.js', import './x.js' and import('./x.js'), with single or double quotes
const IMPORT = /(\bfrom\s*|\bimport\s*\(?\s*)(['"])(\.{1,2}\/[^'"?]+?\.js)\2/g;
let files = 0, imports = 0;
const walk = dir => readdirSync(dir).forEach(name => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p);
    if (!p.endsWith('.js')) return;
    const s = readFileSync(p, 'utf8');
    const out = s.replace(IMPORT, (m, pre, q, path) => { imports++; return `${pre}${q}${path}?v=${id}${q}`; });
    if (out !== s) { writeFileSync(p, out); files++; }
});
walk(join(V2, 'js'));

const indexPath = join(V2, 'index.html');
let html = readFileSync(indexPath, 'utf8');
const swaps = [
    [/<meta name="v2-build" content="[^"]*">/, `<meta name="v2-build" content="${id}">`],
    [/href="styles\.css"/, `href="styles.css?v=${id}"`],
    [/href="tour\.css"/, `href="tour.css?v=${id}"`],
    [/src="js\/app\.js"/, `src="js/app.js?v=${id}"`],
];
for (const [re, to] of swaps) {
    if (!re.test(html)) { console.error(`stamp-build: ${re} not found in index.html`); process.exit(1); }
    html = html.replace(re, to);
}
writeFileSync(indexPath, html);
console.log(`Stamped V2 build ${id}: ${imports} imports in ${files} files, and index.html`);
