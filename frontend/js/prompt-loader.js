/**
 * Prompt loader module.
 * Fetches manifest and fragment files from the public GitHub prompt repository.
 */
import { store } from './store.js';

let repoOwner = 'GarrettPeake';
let repoName = 'AgentsDotMD-prompts';

/**
 * Configure the prompt repository source.
 * @param {string} owner - GitHub repository owner.
 * @param {string} repo - GitHub repository name.
 */
export function setPromptRepoUrl(owner, repo) {
  repoOwner = owner;
  repoName = repo;
}

/**
 * Returns the base raw content URL for the configured prompt repository.
 * @returns {string}
 */
function getBaseUrl() {
  return `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main`;
}

/**
 * Parses YAML frontmatter from a markdown string.
 * Splits on `---` delimiters and parses simple key: value lines.
 * Supports scalar values, simple arrays (comma-separated or YAML list),
 * and nested key-value maps (one level deep).
 *
 * @param {string} markdownText - The raw markdown text with optional frontmatter.
 * @returns {{ metadata: Object, content: string }}
 */
export function parseFrontmatter(markdownText) {
  const trimmed = markdownText.trim();

  if (!trimmed.startsWith('---')) {
    return { metadata: {}, content: trimmed };
  }

  const secondDelimiter = trimmed.indexOf('---', 3);
  if (secondDelimiter === -1) {
    return { metadata: {}, content: trimmed };
  }

  const frontmatterBlock = trimmed.substring(3, secondDelimiter).trim();
  const content = trimmed.substring(secondDelimiter + 3).trim();
  const metadata = {};

  let currentKey = null;
  let currentMap = null;

  const lines = frontmatterBlock.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      continue;
    }

    // Check for indented key-value (nested map entry)
    const indentedMatch = line.match(/^[ \t]+(\S+):\s*(.*)$/);
    if (indentedMatch && currentKey && currentMap !== null) {
      const nestedKey = indentedMatch[1];
      const nestedValue = indentedMatch[2].trim();
      currentMap[nestedKey] = parseScalarValue(nestedValue);
      metadata[currentKey] = currentMap;
      continue;
    }

    // Top-level key: value
    const topMatch = trimmedLine.match(/^(\S+):\s*(.*)$/);
    if (topMatch) {
      currentKey = topMatch[1];
      const rawValue = topMatch[2].trim();

      if (rawValue === '') {
        // Could be a map or list — start collecting
        currentMap = {};
      } else {
        currentMap = null;
        metadata[currentKey] = parseScalarValue(rawValue);
      }
    }
  }

  return { metadata, content };
}

/**
 * Parses a scalar YAML value (numbers, booleans, strings).
 * @param {string} raw - The raw string value.
 * @returns {string|number|boolean}
 */
function parseScalarValue(raw) {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  if (/^\d+\.\d+$/.test(raw)) return parseFloat(raw);
  // Strip surrounding quotes
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1);
  }
  return raw;
}

/**
 * Fetches and parses the prompt repository manifest.
 * Stores technologies in the store.
 * @returns {Promise<Object>} The parsed manifest.
 */
export async function loadManifest() {
  const url = `${getBaseUrl()}/prompts/manifest.json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load manifest: ${response.status} ${response.statusText}`);
  }

  const manifest = await response.json();
  store.set('technologies', manifest.technologies);
  return manifest;
}

/**
 * Fetches all fragments for a given technology.
 * Uses the manifest to determine fragment paths.
 * @param {string} technologyId - The technology identifier.
 * @returns {Promise<Array<{ id: string, content: string, metadata: Object }>>}
 */
export async function loadFragments(technologyId) {
  const manifest = await getManifest();
  const tech = manifest.technologies.find(t => t.id === technologyId);

  if (!tech) {
    throw new Error(`Technology not found: ${technologyId}`);
  }

  const fragmentsDir = `${getBaseUrl()}/prompts/technologies/${technologyId}/fragments`;
  const fragmentPaths = tech.fragments || [];
  const results = await Promise.all(
    fragmentPaths.map(async (fragmentPath) => {
      const url = `${fragmentsDir}/${fragmentPath}`;
      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`Failed to load fragment ${fragmentPath}: ${response.status}`);
        return null;
      }

      const text = await response.text();
      const { metadata, content } = parseFrontmatter(text);
      return {
        id: metadata.id || fragmentPath.replace(/\.md$/, ''),
        content,
        metadata,
      };
    })
  );

  return results.filter(Boolean);
}

/**
 * Loads combination fragments for the given set of technology IDs.
 * Finds matching combination entries in the manifest and loads their fragments.
 * @param {string[]} techIds - Array of selected technology IDs.
 * @returns {Promise<Array<{ id: string, content: string, metadata: Object }>>}
 */
export async function loadCombinationFragments(techIds) {
  const manifest = await getManifest();
  const combinations = manifest.combinations || [];
  const sortedIds = [...techIds].sort();
  const results = [];

  for (const combo of combinations) {
    const comboTechs = [...combo.technologies].sort();
    const isMatch = comboTechs.every(t => sortedIds.includes(t));

    if (!isMatch) {
      continue;
    }

    const comboDir = `${getBaseUrl()}/prompts/combinations/${combo.id}/fragments`;
    const fragmentPaths = combo.fragments || [];

    const fragments = await Promise.all(
      fragmentPaths.map(async (fragmentPath) => {
        const url = `${comboDir}/${fragmentPath}`;
        const response = await fetch(url);

        if (!response.ok) {
          console.warn(`Failed to load combination fragment ${fragmentPath}: ${response.status}`);
          return null;
        }

        const text = await response.text();
        const { metadata, content } = parseFrontmatter(text);
        return {
          id: metadata.id || fragmentPath.replace(/\.md$/, ''),
          content,
          metadata,
        };
      })
    );

    results.push(...fragments.filter(Boolean));
  }

  return results;
}

/**
 * Fetches template files for a given technology.
 * @param {string} technologyId - The technology identifier.
 * @returns {Promise<Array<{ sourcePath: string, outputPath: string, variables: string[], content: string }>>}
 */
export async function loadTemplates(technologyId) {
  const manifest = await getManifest();
  const tech = manifest.technologies.find(t => t.id === technologyId);

  if (!tech || !tech.templates) {
    return [];
  }

  const results = await Promise.all(
    tech.templates.map(async (template) => {
      const url = `${getBaseUrl()}/prompts/${template.sourcePath}`;
      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`Failed to load template ${template.sourcePath}: ${response.status}`);
        return null;
      }

      const content = await response.text();
      return {
        sourcePath: template.sourcePath,
        outputPath: template.outputPath,
        variables: template.variables || [],
        content,
      };
    })
  );

  return results.filter(Boolean);
}

/**
 * Returns the cached manifest, or fetches it if not yet loaded.
 * @returns {Promise<Object>}
 */
let cachedManifest = null;

async function getManifest() {
  if (cachedManifest) {
    return cachedManifest;
  }
  cachedManifest = await loadManifest();
  return cachedManifest;
}
