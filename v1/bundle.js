#!/usr/bin/env node

/**
 * Bundle Script - CI only
 *
 * Concatenates all JS files from index.html into a single bundle
 * and rewrites index.html to reference it. Run after build.js.
 *
 * Minification is handled separately by esbuild in the CI pipeline.
 *
 * Usage: node bundle.js
 */

const fs = require('fs');

const indexPath = 'index.html';
let html = fs.readFileSync(indexPath, 'utf-8');

// Extract script src paths in document order (strip query params)
const scriptRegex = /<script src="([^"?]+)(?:\?v=[a-f0-9]+)?"><\/script>/g;
const scripts = [];
let match;
while ((match = scriptRegex.exec(html)) !== null) {
    scripts.push(match[1]);
}

if (scripts.length === 0) {
    console.log('No scripts found in index.html — nothing to bundle.');
    process.exit(0);
}

// Concatenate with safety semicolons between files
const bundle = scripts.map(src => {
    return fs.readFileSync(src, 'utf-8');
}).join('\n;\n');

fs.writeFileSync('app.bundle.js', bundle);

// Read version hash from manifest
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf-8'));
const version = manifest.version;

// Replace all script tags with single bundle reference
html = html.replace(/\n?\s*<script src="[^"]+"><\/script>/g, '');
html = html.replace('</body>', `    <script src="app.bundle.min.js?v=${version}"></script>\n</body>`);
fs.writeFileSync(indexPath, html);

console.log(`Bundled ${scripts.length} scripts into app.bundle.js`);
console.log('Rewritten index.html to use app.bundle.min.js');
