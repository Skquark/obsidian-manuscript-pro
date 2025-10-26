/**
 * Pandoc Attributes Helper (Phase A)
 * Parse/serialize attributes blocks: {#id .class key=val}
 */

export interface PandocAttributes {
  id?: string;
  classes: string[];
  kv: Record<string, string>;
}

export function parseAttributes(input: string): PandocAttributes {
  const out: PandocAttributes = { classes: [], kv: {} };
  const trimmed = input.trim().replace(/^\{/, '').replace(/\}$/, '');
  if (!trimmed) return out;
  const parts = trimmed.split(/\s+/).filter(Boolean);
  for (const p of parts) {
    if (p.startsWith('#')) {
      out.id = p.substring(1);
    } else if (p.startsWith('.')) {
      out.classes.push(p.substring(1));
    } else if (p.includes('=')) {
      const [k, ...rest] = p.split('=');
      const v = rest.join('=');
      out.kv[k] = v;
    } else if (p.length > 0) {
      // treat as class if bare token
      out.classes.push(p);
    }
  }
  return out;
}

export function serializeAttributes(attrs: PandocAttributes): string | '' {
  const tokens: string[] = [];
  if (attrs.id) tokens.push('#' + attrs.id);
  for (const c of attrs.classes) tokens.push('.' + c);
  for (const [k, v] of Object.entries(attrs.kv)) tokens.push(`${k}=${v}`);
  if (tokens.length === 0) return '';
  return `{${tokens.join(' ')}}`;
}

/**
 * Find trailing attributes block at end of a line, return range indices and raw text
 */
export function findTrailingAttributes(line: string): { from: number; to: number; raw: string } | null {
  // Match ... {#id .class key=val}\s*$
  const m = line.match(/\s*(\{[^}]*\})\s*$/);
  if (!m) return null;
  const raw = m[1];
  const to = line.length;
  const from = to - m[0].length + m[0].indexOf(raw);
  return { from, to, raw };
}

