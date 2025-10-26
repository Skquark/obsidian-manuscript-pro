import { autocompletion, Completion, CompletionContext } from '@codemirror/autocomplete';
import { Extension } from '@codemirror/state';
import { isFountainStateField } from './plugin';
import { TOKEN_NAMES as n, LINE_TOKENS } from './consts';

function unique<T>(arr: T[]): T[] { return Array.from(new Set(arr)); }

function collectCharacters(docText: string): string[] {
  const lines = docText.split(/\r?\n/);
  const chars: string[] = [];
  for (const ln of lines) {
    // naive: character lines are uppercase words possibly with extension (NAME (O.S.))
    if (/^[A-Z][A-Z0-9 '\-.]+(?:\s*\(.*\))?$/.test(ln.trim())) {
      // ignore INT./EXT. etc
      if (/^(INT|EXT)\./.test(ln.trim())) continue;
      chars.push(ln.trim().replace(/\s*\(.*\)$/, ''));
    }
  }
  return unique(chars).slice(0, 100);
}

export function fountainCompletions(): Extension {
  const source = (ctx: CompletionContext) => {
    const state = ctx.state;
    const isFountain = state.field(isFountainStateField, false);
    if (!isFountain) return null;
    const { pos } = ctx;
    const line = state.doc.lineAt(pos);
    const before = line.text.slice(0, pos - line.from);

    // Scene heading at start of line
    if (/^\s*$/.test(before)) {
      const options: Completion[] = [
        { label: 'INT.', type: 'keyword' },
        { label: 'EXT.', type: 'keyword' },
        { label: 'INT./EXT.', type: 'keyword' },
        { label: 'EST.', type: 'keyword' },
      ];
      return { from: line.from + before.length, options };
    }

    // Character name: if previous non-empty line is blank or a scene heading, suggest character names
    const docText = state.doc.toString();
    const chars = collectCharacters(docText);
    if (chars.length && /@[A-Z]*$|^[A-Z][A-Z ]{1,}$/.test(before)) {
      const from = before.lastIndexOf(' ') >= 0 ? line.from + before.lastIndexOf(' ') + 1 : line.from;
      const options: Completion[] = chars.map((c) => ({ label: c, type: 'variable' }));
      return { from, options, filter: true }; 
    }

    // Transitions: when line ends with TO or has CUT
    const trans = ['CUT TO:', 'DISSOLVE TO:', 'SMASH CUT TO:', 'FADE OUT.', 'FADE IN:'];
    if (/[A-Z]*$/.test(before)) {
      const from = before.lastIndexOf(' ') >= 0 ? line.from + before.lastIndexOf(' ') + 1 : line.from;
      const options: Completion[] = trans.map((t) => ({ label: t, type: 'keyword' }));
      return { from, options, filter: true };
    }

    return null;
  };
  return autocompletion({ override: [source] });
}

