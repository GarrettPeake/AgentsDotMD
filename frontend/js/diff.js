/**
 * Unified diff computation module.
 * Provides line-by-line diff using a longest common subsequence algorithm.
 */

/**
 * Computes a line-by-line diff between two strings.
 * Returns an array of diff entries with type and line content.
 *
 * @param {string} original - The original text.
 * @param {string} modified - The modified text.
 * @returns {Array<{ type: 'context' | 'added' | 'removed', line: string }>}
 */
export function computeDiff(original, modified) {
  const originalLines = (original || '').split('\n');
  const modifiedLines = (modified || '').split('\n');
  const lcs = computeLCS(originalLines, modifiedLines);

  const result = [];
  let origIdx = 0;
  let modIdx = 0;
  let lcsIdx = 0;

  while (origIdx < originalLines.length || modIdx < modifiedLines.length) {
    if (
      lcsIdx < lcs.length &&
      origIdx < originalLines.length &&
      modIdx < modifiedLines.length &&
      originalLines[origIdx] === lcs[lcsIdx] &&
      modifiedLines[modIdx] === lcs[lcsIdx]
    ) {
      // Context line — present in both and in LCS
      result.push({ type: 'context', line: originalLines[origIdx] });
      origIdx++;
      modIdx++;
      lcsIdx++;
    } else if (
      origIdx < originalLines.length &&
      (lcsIdx >= lcs.length || originalLines[origIdx] !== lcs[lcsIdx])
    ) {
      // Removed line — in original but not in LCS at this position
      result.push({ type: 'removed', line: originalLines[origIdx] });
      origIdx++;
    } else if (
      modIdx < modifiedLines.length &&
      (lcsIdx >= lcs.length || modifiedLines[modIdx] !== lcs[lcsIdx])
    ) {
      // Added line — in modified but not in LCS at this position
      result.push({ type: 'added', line: modifiedLines[modIdx] });
      modIdx++;
    }
  }

  return result;
}

/**
 * Formats a unified diff string with --- / +++ headers and @@ hunk markers.
 *
 * @param {string} original - The original text.
 * @param {string} modified - The modified text.
 * @param {number} [contextLines=3] - Number of context lines around changes.
 * @returns {string} The unified diff string.
 */
export function formatUnifiedDiff(original, modified, contextLines = 3) {
  const originalLines = (original || '').split('\n');
  const modifiedLines = (modified || '').split('\n');
  const diff = computeDiff(original, modified);

  // Build line mappings to track original and modified line numbers
  const entries = [];
  let origLine = 1;
  let modLine = 1;

  for (const entry of diff) {
    if (entry.type === 'context') {
      entries.push({ ...entry, origLine, modLine });
      origLine++;
      modLine++;
    } else if (entry.type === 'removed') {
      entries.push({ ...entry, origLine, modLine: null });
      origLine++;
    } else if (entry.type === 'added') {
      entries.push({ ...entry, origLine: null, modLine });
      modLine++;
    }
  }

  // Find change regions (non-context entries)
  const changeIndices = [];
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].type !== 'context') {
      changeIndices.push(i);
    }
  }

  if (changeIndices.length === 0) {
    return '';
  }

  // Group changes into hunks based on context overlap
  const hunks = [];
  let hunkStart = Math.max(0, changeIndices[0] - contextLines);
  let hunkEnd = Math.min(entries.length - 1, changeIndices[0] + contextLines);

  for (let i = 1; i < changeIndices.length; i++) {
    const newStart = Math.max(0, changeIndices[i] - contextLines);
    const newEnd = Math.min(entries.length - 1, changeIndices[i] + contextLines);

    if (newStart <= hunkEnd + 1) {
      // Merge with current hunk
      hunkEnd = newEnd;
    } else {
      // Finalize current hunk and start a new one
      hunks.push({ start: hunkStart, end: hunkEnd });
      hunkStart = newStart;
      hunkEnd = newEnd;
    }
  }
  hunks.push({ start: hunkStart, end: hunkEnd });

  // Format output
  const lines = [
    '--- original',
    '+++ modified',
  ];

  for (const hunk of hunks) {
    const hunkEntries = entries.slice(hunk.start, hunk.end + 1);

    // Calculate hunk header line numbers
    let origStart = null;
    let origCount = 0;
    let modStart = null;
    let modCount = 0;

    for (const entry of hunkEntries) {
      if (entry.type === 'context' || entry.type === 'removed') {
        if (origStart === null) {
          origStart = entry.origLine;
        }
        origCount++;
      }
      if (entry.type === 'context' || entry.type === 'added') {
        if (modStart === null) {
          modStart = entry.modLine;
        }
        modCount++;
      }
    }

    origStart = origStart || 1;
    modStart = modStart || 1;

    lines.push(`@@ -${origStart},${origCount} +${modStart},${modCount} @@`);

    for (const entry of hunkEntries) {
      if (entry.type === 'context') {
        lines.push(` ${entry.line}`);
      } else if (entry.type === 'removed') {
        lines.push(`-${entry.line}`);
      } else if (entry.type === 'added') {
        lines.push(`+${entry.line}`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Computes the Longest Common Subsequence (LCS) of two arrays of strings.
 * Uses dynamic programming.
 *
 * @param {string[]} a - First array of lines.
 * @param {string[]} b - Second array of lines.
 * @returns {string[]} The LCS as an array of lines.
 */
function computeLCS(a, b) {
  const m = a.length;
  const n = b.length;

  // Build DP table
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find LCS
  const lcs = [];
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}
