export type FountainElement = 'Scene' | 'Action' | 'Character' | 'Parenthetical' | 'Dialogue' | 'Transition' | 'Lyrics' | 'Unknown';

export function classifyLine(text: string): FountainElement {
  const t = text.trimEnd();
  if (!t.trim()) return 'Action';
  if (/^(\.|INT\.|EXT\.|INT\.\/EXT\.|EST\.)/.test(t)) return 'Scene';
  if (/^[A-Z][A-Z0-9 '\-.]+(?:\s*\(.*\))?$/.test(t) && !/^(INT|EXT)\./.test(t)) return 'Character';
  if (/^\(.*\)$/.test(t)) return 'Parenthetical';
  if (/^[A-Z \-]+TO:$/.test(t) || /^(FADE IN:|FADE OUT\.)$/.test(t)) return 'Transition';
  if (/^~.*/.test(t)) return 'Lyrics';
  // Dialogue heuristics: a non-empty line following character; hard to know in isolation; treat as Action fallback
  return 'Action';
}

