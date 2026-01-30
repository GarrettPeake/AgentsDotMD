/**
 * Template engine for variable interpolation.
 * Replaces {{variableName}} placeholders with provided values.
 */

/**
 * Escapes HTML special characters to prevent injection.
 * @param {string} str - The string to escape.
 * @returns {string} The escaped string.
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') {
    return String(str);
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Replaces all {{variableName}} placeholders in the template with values
 * from the variables object. Values are HTML-escaped to prevent injection.
 * Unmatched placeholders are left as-is.
 *
 * @param {string} templateContent - The template string containing {{variable}} placeholders.
 * @param {Object} variables - Key-value map of variable names to their values.
 * @returns {string} The interpolated string.
 */
export function interpolate(templateContent, variables) {
  if (!templateContent || typeof templateContent !== 'string') {
    return templateContent || '';
  }

  if (!variables || typeof variables !== 'object') {
    return templateContent;
  }

  return templateContent.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
    const trimmed = varName.trim();
    if (Object.prototype.hasOwnProperty.call(variables, trimmed)) {
      return escapeHtml(variables[trimmed]);
    }
    return match;
  });
}

/**
 * Extracts all unique variable names found in a template string.
 * Looks for {{variableName}} patterns and returns an array of unique names.
 *
 * @param {string} templateContent - The template string to scan.
 * @returns {string[]} Array of unique variable names found in the template.
 */
export function extractVariables(templateContent) {
  if (!templateContent || typeof templateContent !== 'string') {
    return [];
  }

  const regex = /\{\{([^}]+)\}\}/g;
  const variables = new Set();
  let match;

  while ((match = regex.exec(templateContent)) !== null) {
    variables.add(match[1].trim());
  }

  return Array.from(variables);
}
