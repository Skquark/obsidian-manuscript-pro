/**
 * Pandoc Attributes Editor Modal (Phase A)
 */

import { App, Modal, Setting, Notice } from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import { parseAttributes, serializeAttributes, PandocAttributes } from './AttributesHelper';

export class AttributesModal extends Modal {
  private attrs: PandocAttributes = { classes: [], kv: {} };
  private onApply: (serialized: string) => void;

  constructor(app: App, private plugin: LatexPandocConcealerPlugin, initialRaw: string | null, onApply: (serialized: string) => void) {
    super(app);
    this.onApply = onApply;
    if (initialRaw) this.attrs = parseAttributes(initialRaw);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('mp-attrs-editor');

    contentEl.createEl('h2', { text: 'Pandoc Attributes' });

    // ID
    new Setting(contentEl).setName('ID').addText((t) => {
      t.setValue(this.attrs.id || '').onChange((v) => (this.attrs.id = v || undefined));
    });

    // Classes (comma-separated)
    new Setting(contentEl).setName('Classes').setDesc('Comma-separated').addText((t) => {
      t.setValue(this.attrs.classes.join(', ')).onChange((v) => {
        this.attrs.classes = v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      });
    });

    // Key/values editor (simple: a single text area key=val tokens space-separated)
    const kvSetting = new Setting(contentEl).setName('Key=Value');
    kvSetting.setDesc('Space-separated key=value pairs');
    kvSetting.addTextArea((ta) => {
      const initial = Object.entries(this.attrs.kv)
        .map(([k, v]) => `${k}=${v}`)
        .join(' ');
      ta.setValue(initial).onChange((v) => {
        const kv: Record<string, string> = {};
        v
          .split(/\s+/)
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((tok) => {
            const eq = tok.indexOf('=');
            if (eq > 0) {
              const k = tok.substring(0, eq);
              const val = tok.substring(eq + 1);
              kv[k] = val;
            }
          });
        this.attrs.kv = kv;
      });
      ta.inputEl.rows = 2;
      ta.inputEl.style.width = '100%';
    });

    const btns = contentEl.createDiv({ cls: 'mp-attrs-buttons' });
    new Setting(btns)
      .addButton((b) =>
        b
          .setButtonText('Apply')
          .setCta()
          .onClick(() => {
            const ser = serializeAttributes(this.attrs);
            this.onApply(ser);
            this.close();
          }),
      )
      .addButton((b) => b.setButtonText('Cancel').onClick(() => this.close()));
  }
}

