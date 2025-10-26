/**
 * Frontmatter Helper: detect, parse and update common Pandoc YAML fields
 * Lightweight parser for a curated set of keys; preserves unknown keys by
 * performing targeted replacements of known blocks.
 */

export interface FrontmatterFields {
  title?: string;
  authors?: string[]; // list of author names
  date?: string;
  abstract?: string;
  keywords?: string[];
  bibliography?: string[];
  csl?: string;
  headerIncludes?: string[];
  extraMeta?: Record<string, string>; // additional key=value pairs
}

export interface FrontmatterBlock {
  start: number; // index of first char of '---' line
  end: number; // index of last char of ending '---' line (exclusive)
  text: string; // inner YAML (between the --- lines)
}

export function findFrontmatter(content: string): FrontmatterBlock | null {
  // Match YAML frontmatter at start of file
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return null;
  const full = m[0];
  const inner = m[1];
  const start = 0;
  const end = full.length;
  return { start, end, text: inner };
}

export function parseFrontmatterFields(yaml: string): FrontmatterFields {
  const lines = yaml.split(/\r?\n/);
  const fields: FrontmatterFields = {};
  const getValue = (s: string) => s.replace(/^\s*\-\s*/, '').trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');

  const readBlockArray = (idx: number): { values: string[]; next: number } => {
    const vals: string[] = [];
    let i = idx + 1;
    while (i < lines.length) {
      const ln = lines[i];
      if (/^\s*\-\s+/.test(ln)) {
        vals.push(getValue(ln));
        i++;
      } else if (/^\s{2,}\S/.test(ln)) {
        // ignore deeper nested structures
        i++;
      } else break;
    }
    return { values: vals, next: i };
  };

  const readLiteralBlock = (idx: number): { text: string; next: number } => {
    // Supports abstract: | followed by indented lines
    let i = idx + 1;
    const chunks: string[] = [];
    while (i < lines.length) {
      const ln = lines[i];
      if (/^\s{2,}/.test(ln) || ln.trim() === '') {
        chunks.push(ln.replace(/^\s{2}/, ''));
        i++;
      } else break;
    }
    return { text: chunks.join('\n').trim(), next: i };
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    const rest = kv[2];
    switch (key) {
      case 'title':
        fields.title = rest.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
        break;
      case 'author':
      case 'authors': {
        if (rest.trim() === '' || rest.trim() === '-') {
          const { values, next } = readBlockArray(i);
          fields.authors = values;
          i = next - 1;
        } else {
          fields.authors = [getValue(rest)];
        }
        break;
      }
      case 'date':
        fields.date = rest.trim();
        break;
      case 'abstract': {
        if (rest.trim() === '|') {
          const { text, next } = readLiteralBlock(i);
          fields.abstract = text;
          i = next - 1;
        } else {
          fields.abstract = rest.trim();
        }
        break;
      }
      case 'keywords': {
        if (rest.trim() === '') {
          const { values, next } = readBlockArray(i);
          fields.keywords = values;
          i = next - 1;
        } else {
          // comma-separated
          fields.keywords = rest.split(',').map((s) => getValue(s)).filter(Boolean);
        }
        break;
      }
      case 'bibliography': {
        if (rest.trim() === '') {
          const { values, next } = readBlockArray(i);
          fields.bibliography = values;
          i = next - 1;
        } else {
          fields.bibliography = [getValue(rest)];
        }
        break;
      }
      case 'csl':
        fields.csl = getValue(rest);
        break;
      case 'header-includes': {
        if (rest.trim() === '') {
          const { values, next } = readBlockArray(i);
          fields.headerIncludes = values;
          i = next - 1;
        } else {
          fields.headerIncludes = [getValue(rest)];
        }
        break;
      }
      default:
        break; // preserve unknown
    }
  }
  return fields;
}

export function updateFrontmatterYaml(originalYaml: string, updated: FrontmatterFields): string {
  const lines = originalYaml.split(/\r?\n/);
  const writeArrayBlock = (key: string, items?: string[]) => {
    if (!items || items.length === 0) return [`${key}:`];
    const out: string[] = [`${key}:`];
    for (const v of items) {
      if (v.includes('\n')) {
        out.push(`  - |`);
        for (const ln of v.split(/\r?\n/)) out.push(`      ${ln}`);
      } else {
        out.push(`  - ${v}`);
      }
    }
    return out;
  };
  const replaceBlock = (key: string, newBlock: string[]) => {
    const startIdx = lines.findIndex((l) => new RegExp(`^${key}:\b`).test(l));
    if (startIdx === -1) {
      // append
      lines.push(...newBlock);
      return;
    }
    // consume following indented list or literal block
    let endIdx = startIdx + 1;
    while (endIdx < lines.length) {
      const ln = lines[endIdx];
      if (/^\s{2,}/.test(ln) || /^\s*\-\s+/.test(ln) || ln.trim() === '') endIdx++;
      else break;
    }
    lines.splice(startIdx, endIdx - startIdx, ...newBlock);
  };

  if (updated.title !== undefined) replaceBlock('title', [`title: ${quoteIfNeeded(updated.title)}`]);
  if (updated.authors !== undefined) replaceBlock('author', writeArrayBlock('author', updated.authors));
  if (updated.date !== undefined) replaceBlock('date', [`date: ${updated.date}`]);
  if (updated.abstract !== undefined) {
    const block = updated.abstract.trim().length
      ? ['abstract: |', ...updated.abstract.split(/\r?\n/).map((l) => `  ${l}`)]
      : ['abstract:'];
    replaceBlock('abstract', block);
  }
  if (updated.keywords !== undefined) replaceBlock('keywords', writeArrayBlock('keywords', updated.keywords));
  if (updated.bibliography !== undefined) replaceBlock('bibliography', writeArrayBlock('bibliography', updated.bibliography));
  if (updated.csl !== undefined) replaceBlock('csl', [`csl: ${quoteIfNeeded(updated.csl)}`]);
  if (updated.headerIncludes !== undefined) replaceBlock('header-includes', writeArrayBlock('header-includes', updated.headerIncludes));
  if (updated.extraMeta) {
    for (const [k, v] of Object.entries(updated.extraMeta)) {
      if (!k || /^(title|author|authors|date|abstract|keywords|bibliography|csl|header-includes)$/.test(k)) continue;
      replaceBlock(k, [`${k}: ${quoteIfNeeded(v)}`]);
    }
  }

  return lines.join('\n').trimEnd();
}

export function buildFrontmatterYaml(fields: FrontmatterFields): string {
  const parts: string[] = [];
  if (fields.title) parts.push(`title: ${quoteIfNeeded(fields.title)}`);
  if (fields.authors && fields.authors.length) parts.push(...[`author:`, ...fields.authors.map((a) => `  - ${a}`)]);
  if (fields.date) parts.push(`date: ${fields.date}`);
  if (fields.abstract) parts.push('abstract: |', ...fields.abstract.split(/\r?\n/).map((l) => `  ${l}`));
  if (fields.keywords && fields.keywords.length)
    parts.push('keywords:', ...fields.keywords.map((k) => `  - ${k}`));
  if (fields.bibliography && fields.bibliography.length)
    parts.push('bibliography:', ...fields.bibliography.map((b) => `  - ${b}`));
  if (fields.csl) parts.push(`csl: ${quoteIfNeeded(fields.csl)}`);
  if (fields.headerIncludes && fields.headerIncludes.length)
    parts.push('header-includes:', ...fields.headerIncludes.map((h) => `  - ${h}`));
  if (fields.extraMeta) {
    for (const [k, v] of Object.entries(fields.extraMeta)) {
      if (!k || /^(title|author|authors|date|abstract|keywords|bibliography|csl|header-includes)$/.test(k)) continue;
      parts.push(`${k}: ${quoteIfNeeded(v)}`);
    }
  }
  return parts.join('\n');
}

function quoteIfNeeded(v?: string): string {
  if (v === undefined) return '';
  const trimmed = v.trim();
  // booleans
  if (/^(true|false)$/i.test(trimmed)) return trimmed.toLowerCase();
  // numbers (int/float)
  if (/^[-+]?\d+(?:\.\d+)?$/.test(trimmed)) return trimmed;
  // otherwise quote if contains YAML special chars
  if (/[#:>-]|^\d/.test(trimmed)) return JSON.stringify(trimmed);
  return trimmed;
}
