/**
 * Frontmatter Editor Modal
 * Structured editor for Pandoc YAML frontmatter with safe round-trip updates.
 */

import { App, Modal, Notice, Setting, TFile } from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import { findFrontmatter, parseFrontmatterFields, updateFrontmatterYaml, buildFrontmatterYaml } from './FrontmatterHelper';

export class FrontmatterEditorModal extends Modal {
  private file: TFile;
  private fields = {
    title: '',
    authors: [] as string[],
    date: '',
    abstract: '',
    keywords: [] as string[],
    bibliography: [] as string[],
    csl: '',
    headerIncludes: [] as string[],
    extraMeta: {} as Record<string, string>,
  };
  private variablesContainer: HTMLElement | null = null;

  constructor(app: App, private plugin: LatexPandocConcealerPlugin, file: TFile) {
    super(app);
    this.file = file;
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('mp-frontmatter-editor');

    contentEl.createEl('h2', { text: 'Edit Frontmatter' });

    try {
      const content = await this.app.vault.read(this.file);
      const fm = findFrontmatter(content);
      if (fm) {
        this.fields = { ...this.fields, ...parseFrontmatterFields(fm.text) } as any;
      }
    } catch (e) {
      new Notice('Failed to read file');
    }

    new Setting(contentEl).setName('Title').addText((t) => t.setValue(this.fields.title || '').onChange((v) => (this.fields.title = v)));

    new Setting(contentEl)
      .setName('Authors')
      .setDesc('One per line')
      .addTextArea((ta) => {
        ta.setValue((this.fields.authors || []).join('\n')).onChange((v) => (this.fields.authors = v.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)));
        ta.inputEl.rows = 3;
      });

    new Setting(contentEl).setName('Date').setDesc('YYYY-MM-DD or free text').addText((t) => t.setValue(this.fields.date || '').onChange((v) => (this.fields.date = v)));

    new Setting(contentEl)
      .setName('Abstract')
      .addTextArea((ta) => {
        ta.setValue(this.fields.abstract || '').onChange((v) => (this.fields.abstract = v));
        ta.inputEl.rows = 5;
      });

    new Setting(contentEl)
      .setName('Keywords')
      .setDesc('Comma-separated')
      .addText((t) => t.setValue((this.fields.keywords || []).join(', ')).onChange((v) => (this.fields.keywords = v.split(',').map((s) => s.trim()).filter(Boolean))));

    const bibSetting = new Setting(contentEl).setName('Bibliography').setDesc('One .bib path per line or add via Browse');
    bibSetting.addTextArea((ta) => {
      ta.setValue((this.fields.bibliography || []).join('\n')).onChange((v) => (this.fields.bibliography = v.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)));
      ta.inputEl.rows = 3;
    });
    bibSetting.addExtraButton((btn) =>
      btn.setIcon('folder').setTooltip('Add .bib').onClick(async () => {
        try {
          const electron = require('electron');
          const dialog = electron?.dialog || electron?.remote?.dialog;
          if (!dialog) throw new Error('Dialog not available');
          const res = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'BibTeX', extensions: ['bib'] }] });
          if (!res.canceled && res.filePaths && res.filePaths[0]) {
            this.fields.bibliography = [...(this.fields.bibliography || []), res.filePaths[0]];
            const ta = bibSetting.settingEl.querySelector('textarea') as HTMLTextAreaElement | null;
            if (ta) ta.value = (this.fields.bibliography || []).join('\n');
          }
        } catch (_) {
          new Notice('File picker not available. Enter path manually.');
        }
      }),
    );

    const cslSetting = new Setting(contentEl).setName('CSL');
    let cslInput: HTMLInputElement | null = null;
    cslSetting.addText((t) => {
      t.setValue(this.fields.csl || '').onChange((v) => { this.fields.csl = v; try { updateCslStatus(); } catch (_) {} });
      cslInput = t.inputEl;
    });
    cslSetting.addExtraButton((btn) =>
      btn.setIcon('folder').setTooltip('Browse...').onClick(async () => {
        try {
          const electron = require('electron');
          const dialog = electron?.dialog || electron?.remote?.dialog;
          if (!dialog) throw new Error('Dialog not available');
          const res = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'CSL', extensions: ['csl'] }] });
          if (!res.canceled && res.filePaths && res.filePaths[0]) {
            this.fields.csl = res.filePaths[0];
            if (cslInput) cslInput.value = this.fields.csl;
            try { updateCslStatus(); } catch (_) {}
          }
        } catch (_) {
          new Notice('File picker not available. Enter path manually.');
        }
      }),
    );
    // Inline CSL status indicator
    const cslStatus = cslSetting.settingEl.createDiv({ cls: 'setting-item-description' });
    const updateCslStatus = () => {
      cslStatus.empty();
      try {
        const fs = require('fs');
        const ok = this.fields.csl && fs.existsSync(this.fields.csl);
        if (this.fields.csl) cslStatus.setText(ok ? '✓ CSL file found' : '✗ CSL file not found');
      } catch (_) {}
    };
    updateCslStatus();

    const headerInc = new Setting(contentEl)
      .setName('Header Includes')
      .setDesc('One entry per line; use "Add Block" for multi-line include');
    headerInc.addTextArea((ta) => {
      ta.setValue((this.fields.headerIncludes || []).join('\n')).onChange((v) => (this.fields.headerIncludes = v.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)));
      ta.inputEl.rows = 3;
    });
    headerInc.addExtraButton((btn) =>
      btn.setIcon('plus').setTooltip('Add Block').onClick(async () => {
        const block = await this.promptBlock('Header Include Block', 'Enter multi-line block to include:');
        if (block && block.trim().length) {
          this.fields.headerIncludes = [...(this.fields.headerIncludes || []), block];
          const ta = headerInc.settingEl.querySelector('textarea') as HTMLTextAreaElement | null;
          if (ta) ta.value = (this.fields.headerIncludes || []).join('\n');
        }
      }),
    );

    // Buttons
    const buttons = contentEl.createDiv({ cls: 'mp-frontmatter-buttons' });
    new Setting(buttons)
      .addButton((b) => b.setButtonText('Apply').setCta().onClick(() => this.applyChanges()))
      .addButton((b) => b.setButtonText('Cancel').onClick(() => this.close()));

    // Variables (typed) section
    contentEl.createEl('h3', { text: 'Variables' });
    this.variablesContainer = contentEl.createDiv({ cls: 'mp-frontmatter-variables' });
    this.renderVariablesSection();
    const varActions = contentEl.createDiv();
    new Setting(varActions)
      .addButton((b) =>
        b
          .setIcon('plus')
          .setTooltip('Add Variable')
          .onClick(() => {
            const base = 'var';
            let i = 1;
            let name = base;
            while (this.fields.extraMeta[name] !== undefined) {
              name = base + i++;
            }
            this.fields.extraMeta[name] = 'true';
            this.renderVariablesSection();
          }),
      );
  }

  private async applyChanges() {
    try {
      const content = await this.app.vault.read(this.file);
      const fm = findFrontmatter(content);
      let newYaml = '';
      if (fm) {
        newYaml = updateFrontmatterYaml(fm.text, {
          title: this.fields.title,
          authors: this.fields.authors,
          date: this.fields.date,
          abstract: this.fields.abstract,
          keywords: this.fields.keywords,
          bibliography: this.fields.bibliography,
          csl: this.fields.csl,
          headerIncludes: this.fields.headerIncludes,
          extraMeta: this.fields.extraMeta,
        });
        const rebuilt = `---\n${newYaml}\n---\n` + content.slice(fm.end);
        await this.app.vault.modify(this.file, rebuilt);
      } else {
        newYaml = buildFrontmatterYaml({
          title: this.fields.title,
          authors: this.fields.authors,
          date: this.fields.date,
          abstract: this.fields.abstract,
          keywords: this.fields.keywords,
          bibliography: this.fields.bibliography,
          csl: this.fields.csl,
          headerIncludes: this.fields.headerIncludes,
          extraMeta: this.fields.extraMeta,
        });
        const rebuilt = `---\n${newYaml}\n---\n\n` + content;
        await this.app.vault.modify(this.file, rebuilt);
      }
      new Notice('Frontmatter updated');
      this.close();
    } catch (e) {
      console.error(e);
      new Notice('Failed to update frontmatter');
    }
  }

  private renderVariablesSection() {
    const container = this.variablesContainer;
    if (!container) return;
    container.empty();
    const entries = Object.entries(this.fields.extraMeta || {});
    if (entries.length === 0) {
      container.createEl('p', { text: 'No variables defined.', cls: 'setting-item-description' });
      return;
    }
    const reserved = new Set(['title', 'author', 'authors', 'date', 'abstract', 'keywords', 'bibliography', 'csl', 'header-includes']);
    entries.forEach(([k, v]) => {
      const row = new Setting(container).setName(k);
      const isReserved = reserved.has(k);
      const type = this.detectType(v);
      let ddRef: any = null;
      row.addDropdown((dd) => {
        ddRef = dd;
        dd
          .addOption('string', 'string')
          .addOption('number', 'number')
          .addOption('boolean', 'boolean')
          .setValue(type)
          .onChange((t) => {
            if (t === 'boolean') this.fields.extraMeta[k] = /^true$/i.test(v) ? 'true' : 'false';
            else if (t === 'number') this.fields.extraMeta[k] = /^[-+]?\d+(?:\.\d+)?$/.test(v) ? v : '0';
            else this.fields.extraMeta[k] = v;
            this.renderVariablesSection();
          });
      });

      // Value control depends on type
      if (type === 'boolean') {
        let tgRef: any = null;
        row.addToggle((tg) => {
          tgRef = tg;
          tg.setValue(/^true$/i.test(v)).onChange((val) => (this.fields.extraMeta[k] = val ? 'true' : 'false'));
        });
        if (isReserved) try { tgRef.inputEl.disabled = true; } catch (_) {}
      } else {
        let tRef: any = null;
        row.addText((t) => {
          tRef = t;
          t.setValue(v).onChange((nv) => (this.fields.extraMeta[k] = nv));
          if (type === 'number') {
            t.inputEl.placeholder = '0';
            t.inputEl.pattern = '[-]?\\d*(?:\\.\\d+)?';
          }
        });
        if (isReserved) try { tRef.inputEl.disabled = true; } catch (_) {}
      }

      // Rename and remove buttons (not for reserved)
      if (!isReserved) {
        row.addExtraButton((btn) =>
          btn.setIcon('pencil').setTooltip('Rename').onClick(async () => {
            const newName = prompt('Rename variable', k) || '';
            const cleaned = newName.trim();
            if (!cleaned) return;
            if (reserved.has(cleaned)) { new Notice('Name is reserved'); return; }
            if (this.fields.extraMeta[cleaned] !== undefined && cleaned !== k) { new Notice('Name already exists'); return; }
            const val = this.fields.extraMeta[k];
            delete this.fields.extraMeta[k];
            this.fields.extraMeta[cleaned] = val;
            this.renderVariablesSection();
          }),
        );
        row.addExtraButton((btn) =>
          btn.setIcon('trash').setTooltip('Remove').onClick(() => {
            delete this.fields.extraMeta[k];
            this.renderVariablesSection();
          }),
        );
      } else {
        row.setDesc('Reserved key (managed above)');
        try { ddRef.selectEl.disabled = true; } catch (_) {}
      }
    });
  }

  private detectType(val: string): 'string' | 'number' | 'boolean' {
    if (/^(true|false)$/i.test(val.trim())) return 'boolean';
    if (/^[-+]?\d+(?:\.\d+)?$/.test(val.trim())) return 'number';
    return 'string';
  }

  private async promptBlock(title: string, desc: string): Promise<string | null> {
    return new Promise((resolve) => {
      const modal = new (class extends Modal {
        private value = '';
        constructor(app: App) { super(app); }
        onOpen() {
          const { contentEl } = this;
          contentEl.empty();
          contentEl.createEl('h3', { text: title });
          contentEl.createEl('p', { text: desc, cls: 'setting-item-description' });
          const ta = contentEl.createEl('textarea');
          ta.style.width = '100%';
          ta.rows = 8;
          ta.addEventListener('input', () => (this.value = ta.value));
          const row = contentEl.createDiv();
          new Setting(row)
            .addButton((b) => b.setButtonText('Add').setCta().onClick(() => { resolve(this.value); this.close(); }))
            .addButton((b) => b.setButtonText('Cancel').onClick(() => { resolve(null); this.close(); }));
        }
      })(this.app);
      modal.open();
    });
  }
}
