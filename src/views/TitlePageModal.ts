import { App, Modal, Setting, TFile, Notice } from 'obsidian';
import type FountainPlugin from '../main.js';

function parseTitlePageText(text: string): { consumed: number; meta: Record<string,string> } {
  const meta: Record<string,string> = {};
  const lines = text.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const ln = lines[i];
    if (!ln.trim()) { i++; continue; }
    const m = ln.match(/^([A-Za-z ]+):\s*(.*)$/);
    if (!m) break;
    const key = m[1].trim(); const val = m[2].trim();
    meta[key] = val;
    i++;
  }
  if (!meta['Title']) return { consumed: 0, meta: {} };
  // Include following single blank line if present
  if (lines[i] !== undefined && !lines[i].trim()) i++;
  return { consumed: i, meta };
}

function buildTitlePage(meta: Record<string,string>): string {
  const order: Array<[string,string|undefined]> = [
    ['Title', meta['Title']],
    ['Credit', meta['Credit']],
    ['Author', meta['Author']],
    ['Draft date', meta['Draft date']],
    ['Contact', meta['Contact']],
  ];
  const lines = order.filter(([,v]) => (v ?? '').trim().length > 0).map(([k,v]) => `${k}: ${v}`);
  return lines.join('\n') + '\n\n';
}

export class TitlePageModal extends Modal {
  private fields = { title: '', credit: '', author: '', draftDate: '', contact: '' };
  constructor(app: App, private plugin: FountainPlugin) { super(app); }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h3', { text: 'Edit Title Page' });

    const view = this.app.workspace.getActiveViewOfType((require('obsidian') as any).MarkdownView);
    const editor = (view as any)?.editor;
    let original = '';
    if (editor) original = editor.getValue();
    const { consumed, meta } = parseTitlePageText(original || '');
    this.fields.title = meta['Title'] || (this.plugin.settings.titleDefaults?.title || '');
    this.fields.credit = meta['Credit'] || (this.plugin.settings.titleDefaults?.credit || '');
    this.fields.author = meta['Author'] || (this.plugin.settings.titleDefaults?.author || '');
    this.fields.draftDate = meta['Draft date'] || (this.plugin.settings.titleDefaults?.draftDate || '');
    this.fields.contact = meta['Contact'] || (this.plugin.settings.titleDefaults?.contact || '');

    const makeRow = (name: string, key: keyof typeof this.fields, ph: string) =>
      new Setting(contentEl).setName(name).addText((t) => t.setPlaceholder(ph).setValue(this.fields[key] || '').onChange((v)=>{ (this.fields as any)[key] = v; }));

    makeRow('Title', 'title', 'My Screenplay');
    makeRow('Credit', 'credit', 'Written by');
    makeRow('Author', 'author', 'Your Name');
    makeRow('Draft date', 'draftDate', 'January 1, 2026');
    makeRow('Contact', 'contact', 'email@domain.com');

    let saveDefaults = false;
    new Setting(contentEl).setName('Save as defaults').addToggle((tg)=>tg.setValue(false).onChange((v)=>saveDefaults=v));

    new Setting(contentEl)
      .addButton((b)=> b.setButtonText('Cancel').onClick(()=> this.close()))
      .addButton((b)=> b.setCta().setButtonText('Apply').onClick(async ()=>{
        try {
          const newMeta: Record<string,string> = {
            'Title': this.fields.title,
            'Credit': this.fields.credit,
            'Author': this.fields.author,
            'Draft date': this.fields.draftDate,
            'Contact': this.fields.contact,
          };
          const block = buildTitlePage(newMeta);
          if (!editor) { new Notice('No active editor'); return; }
          if (consumed > 0) {
            // Replace existing block
            const lines = original.split(/\r?\n/);
            const replace = block + lines.slice(consumed).join('\n');
            editor.setValue(replace);
          } else {
            editor.replaceRange(block, { line: 0, ch: 0 }, { line: 0, ch: 0 });
          }
          if (saveDefaults) {
            this.plugin.settings.titleDefaults = {
              title: this.fields.title,
              credit: this.fields.credit,
              author: this.fields.author,
              draftDate: this.fields.draftDate,
              contact: this.fields.contact,
            };
            await this.plugin.saveSettings();
          }
          this.close();
        } catch (e) {
          console.error(e);
          new Notice('Failed to apply title page');
        }
      }));
  }
}

