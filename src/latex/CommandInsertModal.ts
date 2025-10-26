/**
 * LaTeX Command Insert/Wrap Modal (Phase A)
 */

import { App, Modal, Setting, Notice } from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import type { CommandSpec } from './command-spec';
import { COMMAND_SPECS } from './command-spec';

export class CommandInsertModal extends Modal {
  private specs: CommandSpec[];
  private filtered: CommandSpec[];
  private selected?: CommandSpec;
  private values: Record<string, string> = {};
  private searchQuery = '';
  private forEnvironmentsOnly = false;
  private customInsert?: (text: string) => void;

  constructor(
    app: App,
    private plugin: LatexPandocConcealerPlugin,
    opts?: { environmentsOnly?: boolean; selected?: CommandSpec; values?: Record<string, string>; onInsert?: (text: string) => void },
  ) {
    super(app);
    this.specs = COMMAND_SPECS;
    this.filtered = this.specs;
    this.forEnvironmentsOnly = opts?.environmentsOnly ?? false;
    if (this.forEnvironmentsOnly) {
      this.filtered = this.specs.filter((s) => s.kind === 'environment');
    }
    if (opts?.selected) this.selected = opts.selected;
    if (opts?.values) this.values = { ...opts.values };
    if (opts?.onInsert) this.customInsert = opts.onInsert;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('mp-command-insert');

    contentEl.createEl('h2', { text: this.forEnvironmentsOnly ? 'Wrap with Environment' : 'Insert LaTeX Command' });

    // Search
    new Setting(contentEl)
      .setName('Search')
      .addText((t) =>
        t
          .setPlaceholder('Search commands or environments...')
          .setValue(this.searchQuery)
          .onChange((v) => {
            this.searchQuery = v;
            this.applyFilter();
            this.renderList();
          }),
      );

    // Container layout
    const layout = contentEl.createDiv({ cls: 'mp-command-layout' });
    const listPane = layout.createDiv({ cls: 'mp-command-list' });
    const formPane = layout.createDiv({ cls: 'mp-command-form' });

    // Render both
    this.renderList(listPane);
    this.renderForm(formPane);
  }

  private applyFilter() {
    const q = this.searchQuery.trim().toLowerCase();
    const base = this.forEnvironmentsOnly ? this.specs.filter((s) => s.kind === 'environment') : this.specs;
    this.filtered = q
      ? base.filter((s) =>
          [s.name, s.label, ...(s.aliases || []), ...(s.tags || [])].some((k) => k.toLowerCase().includes(q)),
        )
      : base;
  }

  private renderList(container?: HTMLElement) {
    const host = container || (this.contentEl.querySelector('.mp-command-list') as HTMLElement);
    if (!host) return;
    host.empty();

    this.filtered.forEach((spec) => {
      const item = host.createDiv({ cls: 'mp-command-item' });
      item.createEl('div', { text: spec.label, cls: 'mp-command-title' });
      item.createEl('div', { text: spec.signature, cls: 'mp-command-signature' });
      item.onclick = () => {
        this.selected = spec;
        this.values = {};
        this.renderForm();
      };
    });
  }

  private renderForm(container?: HTMLElement) {
    const host = container || (this.contentEl.querySelector('.mp-command-form') as HTMLElement);
    if (!host) return;
    host.empty();

    if (!this.selected) {
      host.createEl('p', { text: 'Select a command or environment from the list.' });
      return;
    }

    host.createEl('h3', { text: this.selected.label });
    host.createEl('code', { text: this.selected.signature });

    // Build form from args
    this.selected.args.forEach((arg) => {
      const setting = new Setting(host).setName(arg.label || arg.name + (arg.required ? ' *' : ''));
      if (arg.options && arg.options.length > 0) {
        setting.addDropdown((dd) => {
          arg.options!.forEach((opt) => dd.addOption(opt, opt));
          dd.setValue(arg.defaultValue || arg.options![0]);
          this.values[arg.name] = arg.defaultValue || arg.options![0];
          dd.onChange((v) => (this.values[arg.name] = v));
        });
      } else {
        setting.addText((t) => {
          if (arg.defaultValue) {
            t.setValue(arg.defaultValue);
            this.values[arg.name] = arg.defaultValue;
          }
          t.onChange((v) => (this.values[arg.name] = v));
        });
      }
    });

    const btns = host.createDiv({ cls: 'mp-command-buttons' });
    new Setting(btns)
      .addButton((b) =>
        b
          .setButtonText(this.forEnvironmentsOnly ? 'Wrap Selection' : 'Insert')
          .setCta()
          .onClick(() => this.handleInsert()),
      )
      .addButton((b) => b.setButtonText('Cancel').onClick(() => this.close()));
  }

  private handleInsert() {
    if (!this.selected) return;
    const view = this.plugin.app.workspace.getActiveViewOfType(require('obsidian').MarkdownView);
    const editor = view?.editor;
    if (!editor) {
      new Notice('No active editor');
      return;
    }

    const sel = editor.getSelection();
    // Basic required validation
    const missing = this.selected.args
      .filter((a) => a.required)
      .filter((a) => !(this.values[a.name] || (a.kind === 'positional' && sel && !this.forEnvironmentsOnly)))
      .map((a) => a.label || a.name);
    if (missing.length) {
      new Notice(`Missing required: ${missing.join(', ')}`);
      return;
    }

    const text = this.selected.template(this.values, sel || undefined);
    if (this.customInsert) {
      this.customInsert(text);
    } else {
      if (sel) {
        editor.replaceSelection(text);
      } else {
        const cur = editor.getCursor();
        editor.replaceRange(text, cur);
      }
    }

    this.close();
  }
}
