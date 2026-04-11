#!/usr/bin/env node

/**
 * Build Script for The Sahaj Field Guide to Growth & Impact
 *
 * This script scans Markdown files from the content/ directory
 * and generates manifest.json with file paths and frontmatter metadata.
 *
 * The actual content parsing happens at runtime in the browser.
 *
 * Usage: node build.js
 *
 * No external dependencies required - uses only Node.js built-in modules.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { parseFrontmatter } = require('./frontmatter-parser');

const CONTENT_DIR = path.join(__dirname, 'content');
const OUTPUT_FILE = path.join(__dirname, 'manifest.json');

// Scan a directory for markdown files
function scanMarkdownFiles(dir, relativeTo = CONTENT_DIR) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            // Skip icons directory
            if (entry.name !== 'icons') {
                files.push(...scanMarkdownFiles(fullPath, relativeTo));
            }
        } else if (entry.name.endsWith('.md')) {
            files.push(path.relative(relativeTo, fullPath));
        }
    }

    return files;
}

// Main build function
function build() {
    console.log('Building manifest.json from Markdown files...\n');

    const manifest = {
        pages: {},
        personas: [],
        capabilities: []
    };

    // Scan all markdown files
    const mdFiles = scanMarkdownFiles(CONTENT_DIR);

    const personaEntries = [];
    const capabilityEntries = [];

    for (const relativePath of mdFiles) {
        const fullPath = path.join(CONTENT_DIR, relativePath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const { frontmatter } = parseFrontmatter(content);

        // Determine page ID from file path
        let pageId;

        if (relativePath.startsWith('personas/')) {
            // Persona detail pages: personas/explorer.md -> persona-explorer
            pageId = `persona-${frontmatter.id}`;
            personaEntries.push({ id: frontmatter.id, order: frontmatter.order, group: frontmatter.group });
        } else if (relativePath.startsWith('capabilities/')) {
            // Capability detail pages: capabilities/consulting.md -> capability-consulting
            pageId = `capability-${frontmatter.id}`;
            capabilityEntries.push({ id: frontmatter.id, order: frontmatter.order });
        } else if (relativePath.endsWith('.md') && !relativePath.includes('/')) {
            // Top-level pages: home.md -> home, quick-reference.md -> quick-reference
            pageId = relativePath.slice(0, -3);
        } else {
            console.log(`  Skipped: ${relativePath} (unknown structure)`);
            continue;
        }

        // Build page entry
        manifest.pages[pageId] = {
            file: `content/${relativePath}`,
            ...frontmatter
        };

        console.log(`  Indexed: ${relativePath} -> ${pageId}`);
    }

    // Sort and extract ordered lists
    personaEntries.sort((a, b) => a.order - b.order);
    capabilityEntries.sort((a, b) => a.order - b.order);

    manifest.personas = personaEntries.map(p => p.id);
    manifest.capabilities = capabilityEntries.map(c => c.id);

    // Build persona groups from explicit frontmatter group field
    manifest.personaGroups = {};
    for (const entry of personaEntries) {
        if (entry.group) {
            if (!manifest.personaGroups[entry.group]) {
                manifest.personaGroups[entry.group] = [];
            }
            manifest.personaGroups[entry.group].push(entry.id);
        }
    }

    // Generate build hash from source files
    const jsModules = ['frontmatter-parser.js', 'js/markdown.js', 'js/content.js', 'js/personas.js',
                       'js/diagrams.js', 'js/theme.js', 'js/router.js', 'js/layouts.js', 'js/app.js'];
    const hashSources = [...jsModules, 'styles.css']
        .map(f => fs.readFileSync(path.join(__dirname, f), 'utf-8'))
        .join('');
    const buildHash = crypto.createHash('md5').update(hashSources + JSON.stringify(manifest)).digest('hex').slice(0, 8);
    manifest.version = buildHash;

    // Write manifest.json
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2), 'utf-8');

    // Update cache-busting params in index.html
    const indexPath = path.join(__dirname, 'index.html');
    let indexHtml = fs.readFileSync(indexPath, 'utf-8');
    indexHtml = indexHtml.replace(/(href="styles\.css)(\?v=[a-f0-9]+)?(")/g, `$1?v=${buildHash}$3`);
    indexHtml = indexHtml.replace(/(src="[^"]+\.js)(\?v=[a-f0-9]+)?(")/g, `$1?v=${buildHash}$3`);
    fs.writeFileSync(indexPath, indexHtml, 'utf-8');

    console.log(`\nGenerated: manifest.json (version: ${buildHash})`);
    console.log(`  ${Object.keys(manifest.pages).length} pages indexed`);
    console.log(`  ${manifest.personas.length} personas: ${manifest.personas.join(', ')}`);
    console.log(`  ${manifest.capabilities.length} capabilities: ${manifest.capabilities.join(', ')}`);
    console.log(`  Updated index.html with cache-busting v=${buildHash}`);
    console.log('\nBuild complete!');
}

// Run build
build();
