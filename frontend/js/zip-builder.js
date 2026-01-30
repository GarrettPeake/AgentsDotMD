/**
 * Zip builder module.
 * Uses JSZip to package generated files for download.
 */
import { store } from './store.js';
import JSZip from '../vendor/jszip.min.js';

/**
 * Builds a zip archive containing the generated markdown file,
 * interpolated template files, and a composite .gitignore.
 * @returns {Promise<Blob>} The zip archive as a Blob.
 */
export async function buildZip() {
  const zip = new JSZip();

  const filename = store.get('filename') || 'AGENTS.md';
  const generatedMarkdown = store.get('generatedMarkdown') || '';
  const templateFiles = store.get('templateFiles') || [];
  const options = store.get('options') || {};
  const technologies = store.get('technologies') || [];
  const selectedTechIds = store.get('selectedTechIds') || [];

  // Add the generated markdown file
  zip.file(filename, generatedMarkdown);

  // Flatten options for template interpolation
  const flatOptions = flattenOptions(options);

  // Add interpolated template files
  for (const template of templateFiles) {
    const interpolatedContent = interpolateTemplate(template.content, flatOptions);
    zip.file(template.outputPath, interpolatedContent);
  }

  // Build and add composite .gitignore
  const gitignoreContent = buildCompositeGitignore(selectedTechIds, technologies);
  if (gitignoreContent) {
    zip.file('.gitignore', gitignoreContent);
  }

  return zip.generateAsync({ type: 'blob' });
}

/**
 * Builds the zip and triggers a browser download.
 * Creates a temporary download link and clicks it.
 */
export async function downloadZip() {
  const blob = await buildZip();
  const filename = store.get('filename') || 'AGENTS.md';
  const zipFilename = filename.replace(/\.md$/, '') + '-project.zip';

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Flattens nested options object into a flat key-value map.
 * @param {Object} options - Nested options: { techId: { optionId: value } }
 * @returns {Object} Flat map of variable names to values.
 */
function flattenOptions(options) {
  const flat = {};
  for (const [techId, techOpts] of Object.entries(options)) {
    if (typeof techOpts === 'object' && techOpts !== null) {
      for (const [key, value] of Object.entries(techOpts)) {
        flat[key] = value;
        flat[`${techId}.${key}`] = value;
      }
    }
  }
  return flat;
}

/**
 * Simple template interpolation for zip file contents.
 * Replaces {{variableName}} with values from the flat options map.
 * @param {string} content - Template content.
 * @param {Object} flatOptions - Flat key-value map.
 * @returns {string} Interpolated content.
 */
function interpolateTemplate(content, flatOptions) {
  return content.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
    const trimmed = varName.trim();
    return flatOptions[trimmed] !== undefined ? String(flatOptions[trimmed]) : match;
  });
}

/**
 * Builds a composite .gitignore by merging entries from all selected technologies.
 * @param {string[]} selectedTechIds - Selected technology IDs.
 * @param {Array} technologies - All technologies from the manifest.
 * @returns {string} The composite .gitignore content, or empty string if none.
 */
function buildCompositeGitignore(selectedTechIds, technologies) {
  const entries = new Set();
  const sections = [];

  for (const techId of selectedTechIds) {
    const tech = technologies.find(t => t.id === techId);
    if (!tech || !tech.gitignore || tech.gitignore.length === 0) {
      continue;
    }

    sections.push(`# ${tech.name}`);
    for (const entry of tech.gitignore) {
      if (!entries.has(entry)) {
        entries.add(entry);
        sections.push(entry);
      }
    }
    sections.push('');
  }

  return sections.join('\n').trim();
}
