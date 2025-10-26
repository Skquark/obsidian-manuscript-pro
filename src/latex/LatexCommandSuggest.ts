/**
 * Backslash LaTeX Command Suggest (Phase B baseline)
 * Suggests commands from spec library when typing \\name
 */

import { Editor, EditorPosition, EditorSuggest, EditorSuggestContext, EditorSuggestTriggerInfo, TFile } from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import { COMMAND_SPECS, CommandSpec } from './command-spec';
import { CommandInsertModal } from './CommandInsertModal';

interface CmdSuggestion { spec: CommandSpec; display: string; signature: string }

export class LatexCommandSuggest extends EditorSuggest<CmdSuggestion> {
  constructor(private plugin: LatexPandocConcealerPlugin) {
    super(plugin.app);
  }

  onTrigger(cursor: EditorPosition, editor: Editor, file: TFile | null): EditorSuggestTriggerInfo | null {
    const line = editor.getLine(cursor.line);
    const before = line.substring(0, cursor.ch);
    const m = before.match(/\\([A-Za-z]*)$/);
    if (!m) return null;
    const partial = m[1];
    // only trigger on at least one letter after backslash
    if (partial.length === 0) return null;
    return {
      start: { line: cursor.line, ch: cursor.ch - (partial.length + 1) },
      end: cursor,
      query: partial,
    };
  }

  getSuggestions(ctx: EditorSuggestContext): CmdSuggestion[] {
    const q = (ctx.query || '').toLowerCase();
    const list = COMMAND_SPECS.filter((s) => s.kind !== 'environment');
    const matched = list.filter((s) => s.name.replace('\\', '').toLowerCase().startsWith(q) || (s.aliases || []).some((a) => a.toLowerCase().startsWith(q)));
    return matched.slice(0, 20).map((spec) => ({ spec, display: spec.label, signature: spec.signature }));
  }

  renderSuggestion(s: CmdSuggestion, el: HTMLElement): void {
    const row = el.createDiv({ cls: 'latex-cmd-suggest' });
    row.createEl('span', { text: s.display, cls: 'latex-cmd-name' });
    row.createEl('code', { text: s.signature, cls: 'latex-cmd-sig' });
  }

  selectSuggestion(s: CmdSuggestion): void {
    const editor = this.context?.editor;
    if (!editor) return;
    const start = this.context!.start!;
    const end = this.context!.end!;
    // Remove the typed token (e.g., \incl)
    editor.replaceRange('', start, end);
    // Open the insert modal for this spec; insert at current cursor
    new CommandInsertModal(this.plugin.app, this.plugin, { selected: s.spec }).open();
  }
}

