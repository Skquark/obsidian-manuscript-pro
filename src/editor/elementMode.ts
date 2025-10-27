import { keymap } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { classifyLine, type Element } from './classify';
import { isFountainStateField } from './plugin';

function setLine(view: EditorView, lineNo: number, text: string) {
  const line = view.state.doc.line(lineNo + 1);
  view.dispatch({ changes: { from: line.from, to: line.to, insert: text } });
}

function transform(view: EditorView, fn: (t: string)=>string): boolean {
  const isFountain = view.state.field(isFountainStateField, false);
  if (!isFountain) return false;
  const sel = view.state.selection.main;
  const line = view.state.doc.lineAt(sel.from);
  const text = line.text ?? '';
  const updated = fn(text);
  setLine(view, line.number - 1, updated);
  return true;
}

function toScene(t: string): string { const s=t.trim(); const base = s.startsWith('.')? s : ('.'+s); return base.toUpperCase(); }
function toCharacter(t: string): string { const s=t.trim(); const base = s.startsWith('@')? s : ('@'+s); return base.toUpperCase(); }
function toParenthetical(t: string): string { const s=t.trim(); if (s.startsWith('(') && s.endsWith(')')) return s; return `(${s})`; }
function toTransition(t: string): string { const u=t.trim().toUpperCase(); if (/TO:$/.test(u) || u==='FADE IN:'||u==='FADE OUT.') return u; return u.endsWith(' TO:')? u : (u + ' TO:'); }
function toDialogue(t: string): string { return t; }
function toAction(t: string): string { return t.replace(/^[@.]/,''); }

const order: Element[] = ['Scene','Action','Character','Parenthetical','Dialogue','Transition'];

export function nextElementText(text: string, dir: 1|-1): string {
  const current = classifyLine(text) as Element;
  const idx = Math.max(0, order.indexOf(current));
  const next = order[(idx + (dir===1?1:order.length-1)) % order.length];
  switch (next) {
    case 'Scene': return toScene(text);
    case 'Character': return toCharacter(text);
    case 'Parenthetical': return toParenthetical(text);
    case 'Dialogue': return toDialogue(text);
    case 'Transition': return toTransition(text);
    case 'Action': default: return toAction(text);
  }
}

function cycle(view: EditorView, dir: 1|-1): boolean {
  return transform(view, (t) => {
    return nextElementText(t, dir);
  });
}

export function elementKeymap(): Extension {
  return keymap.of([
    { key: 'Tab', run: (v)=>cycle(v, 1) },
    { key: 'Shift-Tab', run: (v)=>cycle(v, -1) },
    { key: 'Enter', run: (v) => {
        const isFountain = v.state.field(isFountainStateField, false);
        if (!isFountain) return false;
        const sel = v.state.selection.main;
        const line = v.state.doc.lineAt(sel.from);
        const t = line.text ?? '';
        const el = classifyLine(t) as Element;
        // For Character/Parenthetical/Dialogue, insert newline to continue flow into dialogue
        if (el==='Character' || el==='Parenthetical' || el==='Dialogue') {
          v.dispatch({ changes: { from: sel.from, to: sel.to, insert: '\n' } });
          return true;
        }
        return false;
      }
    },
    { key: 'Backspace', run: (v) => {
        const isFountain = v.state.field(isFountainStateField, false);
        if (!isFountain) return false;
        const sel = v.state.selection.main;
        if (sel.from !== sel.to) return false;
        const line = v.state.doc.lineAt(sel.from);
        if (sel.from !== line.from) return false; // only at line start
        const t = line.text ?? '';
        let updated = t;
        if (t.trimStart().startsWith('.')) updated = t.replace(/^(\s*)\./, '$1');
        else if (t.trimStart().startsWith('@')) updated = t.replace(/^(\s*)@/, '$1');
        else if (/^\s*\(.*\)\s*$/.test(t)) updated = t.replace(/^\s*\((.*)\)\s*$/, '$1');
        if (updated !== t) { setLine(v, line.number-1, updated); return true; }
        return false;
      }
    },
  ]);
}

