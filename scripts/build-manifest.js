#!/usr/bin/env node

/**
 * Build script: generates frontend/prompts/manifest.json from the file tree.
 *
 * Directory convention:
 *   frontend/prompts/technologies/{id}/meta.json   — technology metadata
 *   frontend/prompts/technologies/{id}/fragments/   — markdown fragments
 *   frontend/prompts/combinations/{id}/meta.json    — combination metadata
 *   frontend/prompts/combinations/{id}/fragments/   — combination fragments
 *   frontend/prompts/templates/{id}/                — template files (.tmpl)
 *
 * Run: node scripts/build-manifest.js
 */

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..', 'frontend', 'prompts');
const TECHNOLOGIES_DIR = join(ROOT, 'technologies');
const COMBINATIONS_DIR = join(ROOT, 'combinations');
const OUTPUT = join(ROOT, 'manifest.json');

async function dirExists(path) {
  try {
    const s = await stat(path);
    return s.isDirectory();
  } catch {
    return false;
  }
}

async function listDirs(parent) {
  if (!(await dirExists(parent))) return [];
  const entries = await readdir(parent, { withFileTypes: true });
  return entries.filter(e => e.isDirectory()).map(e => e.name);
}

async function listFiles(dir, ext) {
  if (!(await dirExists(dir))) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter(e => e.isFile() && (!ext || e.name.endsWith(ext)))
    .map(e => e.name)
    .sort();
}

/**
 * Parse YAML frontmatter from a markdown string.
 * Returns { metadata, content }.
 */
function parseFrontmatter(text) {
  const trimmed = text.trim();
  if (!trimmed.startsWith('---')) return { metadata: {}, content: trimmed };

  const end = trimmed.indexOf('---', 3);
  if (end === -1) return { metadata: {}, content: trimmed };

  const block = trimmed.substring(3, end).trim();
  const content = trimmed.substring(end + 3).trim();
  const metadata = {};

  let currentKey = null;
  let currentMap = null;

  for (const line of block.split('\n')) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Indented line → nested map entry
    const indented = line.match(/^[ \t]+(\S+):\s*(.*)$/);
    if (indented && currentKey && currentMap !== null) {
      currentMap[indented[1]] = parseScalar(indented[2].trim());
      metadata[currentKey] = currentMap;
      continue;
    }

    // Top-level key: value
    const top = trimmedLine.match(/^(\S+):\s*(.*)$/);
    if (top) {
      currentKey = top[1];
      const val = top[2].trim();
      if (val === '') {
        currentMap = {};
      } else {
        currentMap = null;
        metadata[currentKey] = parseScalar(val);
      }
    }
  }

  return { metadata, content };
}

function parseScalar(raw) {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  if (/^\d+\.\d+$/.test(raw)) return parseFloat(raw);
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1);
  }
  return raw;
}

async function buildTechnology(techId) {
  const techDir = join(TECHNOLOGIES_DIR, techId);
  const metaPath = join(techDir, 'meta.json');

  let meta;
  try {
    meta = JSON.parse(await readFile(metaPath, 'utf-8'));
  } catch (err) {
    console.warn(`  ⚠ Skipping ${techId}: cannot read meta.json (${err.message})`);
    return null;
  }

  // List fragment filenames
  const fragmentFiles = await listFiles(join(techDir, 'fragments'), '.md');

  // Read each fragment to extract frontmatter metadata for the manifest
  const fragmentsMeta = [];
  for (const file of fragmentFiles) {
    const text = await readFile(join(techDir, 'fragments', file), 'utf-8');
    const { metadata } = parseFrontmatter(text);
    fragmentsMeta.push({
      file,
      id: metadata.id || file.replace(/\.md$/, ''),
      category: metadata.category || 'general',
      sortOrder: metadata.sortOrder ?? 200,
    });
  }

  // Discover template files from the templates directory on disk,
  // falling back to meta.json entries if the directory doesn't exist.
  const TEMPLATES_DIR = join(ROOT, 'templates', techId);
  let templates = [];

  const tmplFiles = await listFiles(TEMPLATES_DIR, '.tmpl');
  if (tmplFiles.length > 0) {
    // Auto-discover templates from the file system
    for (const tmplFile of tmplFiles) {
      const outputName = tmplFile.replace(/\.tmpl$/, '');
      const content = await readFile(join(TEMPLATES_DIR, tmplFile), 'utf-8');
      const variables = [];
      const varRegex = /\{\{([^}]+)\}\}/g;
      let match;
      while ((match = varRegex.exec(content)) !== null) {
        const varName = match[1].trim();
        if (!variables.includes(varName)) {
          variables.push(varName);
        }
      }
      templates.push({
        sourcePath: `templates/${techId}/${tmplFile}`,
        outputPath: outputName,
        variables,
      });
    }
  } else if (meta.templates && meta.templates.length > 0) {
    // Fallback: expand string entries from meta.json into objects
    templates = meta.templates.map(t => {
      if (typeof t === 'string') {
        return {
          sourcePath: `templates/${techId}/${t}.tmpl`,
          outputPath: t,
          variables: [],
        };
      }
      return t;
    });
  }

  // Build the technology entry — meta.json is the source of truth for everything
  // except the fragments list and templates, which come from the file tree.
  return {
    id: techId,
    name: meta.name,
    description: meta.description,
    icon: meta.icon || `${techId}.svg`,
    categories: meta.categories || [],
    options: meta.options || [],
    fragments: fragmentFiles,
    templates,
    gitignore: meta.gitignore || [],
    incompatibleWith: meta.incompatibleWith || [],
    combinationsWith: meta.combinationsWith || [],
  };
}

async function buildCombination(comboId) {
  const comboDir = join(COMBINATIONS_DIR, comboId);
  const metaPath = join(comboDir, 'meta.json');

  let meta;
  try {
    meta = JSON.parse(await readFile(metaPath, 'utf-8'));
  } catch (err) {
    console.warn(`  ⚠ Skipping combination ${comboId}: cannot read meta.json (${err.message})`);
    return null;
  }

  const fragmentFiles = await listFiles(join(comboDir, 'fragments'), '.md');

  return {
    id: comboId,
    technologies: meta.technologies || [],
    description: meta.description || '',
    fragments: fragmentFiles,
  };
}

async function main() {
  console.log('Building manifest.json from prompt file tree...');
  console.log(`  Source: ${ROOT}`);

  // Build technologies
  const techIds = await listDirs(TECHNOLOGIES_DIR);
  console.log(`  Found ${techIds.length} technology directories`);

  const technologies = [];
  for (const id of techIds.sort()) {
    const tech = await buildTechnology(id);
    if (tech) {
      technologies.push(tech);
      console.log(`  ✓ ${tech.name} (${tech.fragments.length} fragments)`);
    }
  }

  // Build combinations
  const comboIds = await listDirs(COMBINATIONS_DIR);
  console.log(`  Found ${comboIds.length} combination directories`);

  const combinations = [];
  for (const id of comboIds.sort()) {
    const combo = await buildCombination(id);
    if (combo) {
      combinations.push(combo);
      console.log(`  ✓ ${combo.id} (${combo.fragments.length} fragments)`);
    }
  }

  const manifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    technologies,
    combinations,
  };

  await writeFile(OUTPUT, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  console.log(`\n  ✅ Wrote ${OUTPUT}`);
  console.log(`     ${technologies.length} technologies, ${combinations.length} combinations`);
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
