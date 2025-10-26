/**
 * Table Wizard (Phase C baseline)
 * Generate Markdown or LaTeX tables with headers, alignment, caption/label.
 */

import { App, Modal, Setting } from 'obsidian';

type TableFormat = 'markdown' | 'latex';
type Align = 'left' | 'center' | 'right';

export class TableWizardModal extends Modal {
  private format: TableFormat = 'markdown';
  private columns = 3;
  private rows = 2;
  private includeHeader = true;
  private alignments: Align[] = ['left', 'center', 'right'];
  private headers: string[] = ['Column 1', 'Column 2', 'Column 3'];
  private caption = '';
  private label = '';
  private onInsert: (text: string) => void;
  private csvText = '';
  private csvData: string[][] | null = null;
  private latexUseBooktabs = false;
  private latexUseHlines = false;
  private latexVerticalBars = false;
  private latexIncludeCentering = true;
  private previewEl: HTMLElement | null = null;
  private csvHeaderFromFirstRow = true;

  constructor(app: App, onInsert: (text: string) => void) {
    super(app);
    this.onInsert = onInsert;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('mp-table-wizard');

    contentEl.createEl('h2', { text: 'Insert Table' });

    new Setting(contentEl)
      .setName('Format')
      .addDropdown((dd) =>
        dd
          .addOption('markdown', 'Markdown')
          .addOption('latex', 'LaTeX')
          .setValue(this.format)
          .onChange((v: TableFormat) => { this.format = v; this.updatePreview(); }),
      );

    new Setting(contentEl)
      .setName('Columns')
      .addSlider((s) =>
        s
          .setLimits(1, 10, 1)
          .setValue(this.columns)
          .setDynamicTooltip()
          .onChange((v) => {
            this.columns = v;
            this.syncArrays();
            this.renderColumnsSection();
          }),
      );

    new Setting(contentEl)
      .setName('Rows')
      .setDesc('Data rows (not including header)')
      .addSlider((s) => s.setLimits(1, 10, 1).setValue(this.rows).setDynamicTooltip().onChange((v) => { this.rows = v; this.updatePreview(); }));

    new Setting(contentEl)
      .setName('Include Header')
      .addToggle((t) => t.setValue(this.includeHeader).onChange((v) => { this.includeHeader = v; this.updatePreview(); }));

    // Columns config container
    contentEl.createEl('h3', { text: 'Columns' });
    contentEl.createDiv({ cls: 'mp-table-columns' });
    this.renderColumnsSection();

    // CSV paste (optional)
    contentEl.createEl('h3', { text: 'Paste CSV/TSV (optional)' });
    const csvDesc = contentEl.createEl('p', { text: 'Paste comma- or tab-separated values to auto-fill headers and rows.' });
    csvDesc.addClass('setting-item-description');
    new Setting(contentEl)
      .setName('Data')
      .addTextArea((ta) => {
        ta.setPlaceholder('col1,col2,col3\nval11,val12,val13\nval21,val22,val23');
        ta.setValue(this.csvText);
        ta.onChange((v) => {
          this.csvText = v;
          this.csvData = this.parseCSV(v);
          if (this.csvData && this.csvData.length > 0) {
            const delimCols = Math.max(...this.csvData.map((r) => r.length));
            this.columns = Math.max(1, delimCols);
            this.syncArrays();
            if (this.includeHeader && this.csvHeaderFromFirstRow) {
              const first = this.csvData[0];
              for (let i = 0; i < this.columns; i++) this.headers[i] = first[i] || this.headers[i] || `Column ${i + 1}`;
            }
            const dataRows = this.csvHeaderFromFirstRow ? Math.max(0, this.csvData.length - 1) : this.csvData.length;
            this.rows = Math.max(this.rows, dataRows);
            this.renderColumnsSection();
          } else {
            this.csvData = null;
          }
          this.updatePreview();
        });
        ta.inputEl.rows = 5;
        ta.inputEl.style.width = '100%';
      });

    new Setting(contentEl)
      .setName('Use first CSV row as header')
      .setDesc('Derive headers from the first pasted row (if available)')
      .addToggle((tg) => tg.setValue(this.csvHeaderFromFirstRow).onChange((v) => { this.csvHeaderFromFirstRow = v; this.updatePreview(); }));

    new Setting(contentEl)
      .setName('Guess alignment from data')
      .setDesc('Set numeric columns to right-aligned based on CSV content')
      .addButton((b) => b.setButtonText('Guess').onClick(() => { this.guessAlignmentFromCSV(); this.renderColumnsSection(); this.updatePreview(); }));

    // Caption & label
    contentEl.createEl('h3', { text: 'Caption & Label' });
    new Setting(contentEl).setName('Caption').addText((t) => t.setValue(this.caption).onChange((v) => { this.caption = v; this.updatePreview(); }));
    new Setting(contentEl).setName('Label (LaTeX)').addText((t) => t.setPlaceholder('my-table').setValue(this.label).onChange((v) => { this.label = v; this.updatePreview(); }));

    // LaTeX options
    contentEl.createEl('h3', { text: 'LaTeX Options' });
    new Setting(contentEl)
      .setName('Use booktabs rules')
      .setDesc('Insert \\toprule/\\midrule/\\bottomrule (requires booktabs package)')
      .addToggle((tg) => tg.setValue(this.latexUseBooktabs).onChange((v) => { this.latexUseBooktabs = v; if (v) this.latexUseHlines = false; this.updatePreview(); }));

    new Setting(contentEl)
      .setName('Use simple \hline rules')
      .setDesc('Add \hline after header and at end (ignored if booktabs is enabled)')
      .addToggle((tg) => tg.setValue(this.latexUseHlines).onChange((v) => { this.latexUseHlines = v; if (v) this.latexUseBooktabs = false; this.updatePreview(); }));

    new Setting(contentEl)
      .setName('Vertical bars in colspec')
      .setDesc("Add '|' separators in tabular column spec like |c|c|c|")
      .addToggle((tg) => tg.setValue(this.latexVerticalBars).onChange((v) => { this.latexVerticalBars = v; this.updatePreview(); }));

    new Setting(contentEl)
      .setName('Include \\centering')
      .setDesc('Add \\centering inside the table environment')
      .addToggle((tg) => tg.setValue(this.latexIncludeCentering).onChange((v) => { this.latexIncludeCentering = v; this.updatePreview(); }));

    // Buttons
    const buttons = contentEl.createDiv({ cls: 'mp-table-buttons' });
    new Setting(buttons)
      .addButton((b) => b.setButtonText('Insert').setCta().onClick(() => this.insert()))
      .addButton((b) => b.setButtonText('Cancel').onClick(() => this.close()));

    // Preview
    contentEl.createEl('h3', { text: 'Preview' });
    this.previewEl = contentEl.createEl('pre', { cls: 'mp-table-preview' });
    this.updatePreview();
    const previewBtns = contentEl.createDiv({ cls: 'mp-table-preview-actions' });
    new Setting(previewBtns)
      .addButton((b) => b.setButtonText('Copy Preview').onClick(async () => {
        try { await navigator.clipboard.writeText(this.previewEl?.innerText || ''); } catch (_) {}
      }));
  }

  private syncArrays() {
    // ensure headers/alignments length = columns
    while (this.headers.length < this.columns) this.headers.push(`Column ${this.headers.length + 1}`);
    while (this.alignments.length < this.columns) this.alignments.push('left');
    if (this.headers.length > this.columns) this.headers = this.headers.slice(0, this.columns);
    if (this.alignments.length > this.columns) this.alignments = this.alignments.slice(0, this.columns);
  }

  private renderColumnsSection() {
    const container = this.contentEl.querySelector('.mp-table-columns') as HTMLElement;
    if (!container) return;
    container.empty();
    for (let i = 0; i < this.columns; i++) {
      const row = container.createDiv({ cls: 'mp-table-col-row' });
      new Setting(row)
        .setName(`Column ${i + 1}`)
        .addDropdown((dd) =>
          dd
            .addOption('left', 'Left')
            .addOption('center', 'Center')
            .addOption('right', 'Right')
            .setValue(this.alignments[i])
            .onChange((v: Align) => {
              this.alignments[i] = v;
              this.updatePreview();
            }),
        )
        .addText((t) =>
          t
            .setPlaceholder(`Header ${i + 1}`)
            .setValue(this.headers[i])
            .onChange((v) => {
              this.headers[i] = v;
              this.updatePreview();
            }),
        );
    }
    this.updatePreview();
  }

  private insert() {
    const text = this.format === 'markdown' ? this.buildMarkdown() : this.buildLatex();
    this.onInsert(text);
    this.close();
  }

  private buildMarkdown(): string {
    const cols = this.columns;
    const alignMap: Record<Align, string> = { left: ':---', center: ':---:', right: '---:' };
    const align = `| ${this.alignments.slice(0, cols).map((a) => alignMap[a]).join(' | ')} |`;

    let headerLine = `| ${Array.from({ length: cols }).map((_, i) => this.headers[i] || `Col ${i + 1}`).join(' | ')} |`;
    const dataLines: string[] = [];
    if (this.csvData && this.csvData.length > 0) {
      const start = this.csvHeaderFromFirstRow ? 1 : 0;
      if (this.includeHeader) {
        if (this.csvHeaderFromFirstRow) {
          const h = this.csvData[0];
          headerLine = `| ${Array.from({ length: cols }).map((_, i) => (h[i] ?? '')).join(' | ')} |`;
        } else {
          headerLine = `| ${Array.from({ length: cols }).map((_, i) => this.headers[i] || `Col ${i + 1}`).join(' | ')} |`;
        }
      }
      for (let r = start; r < this.csvData.length; r++) {
        const row = this.csvData[r];
        const line = `| ${Array.from({ length: cols }).map((_, i) => (row[i] ?? '')).join(' | ')} |`;
        dataLines.push(line);
      }
    } else {
      const blankRow = `| ${Array.from({ length: cols }).map(() => ' ').join(' | ')} |`;
      for (let i = 0; i < this.rows; i++) dataLines.push(blankRow);
    }
    const out = [headerLine, `| ${this.alignments.slice(0, cols).map((a) => alignMap[a]).join(' | ')} |`, ...dataLines].join('\n');
    const caption = this.caption ? `\n\n${this.caption}\n` : '';
    return out + caption;
  }

  private buildLatex(): string {
    const alignMap: Record<Align, string> = { left: 'l', center: 'c', right: 'r' };
    let colSpec = this.alignments.slice(0, this.columns).map((a) => alignMap[a]).join('');
    if (this.latexVerticalBars) {
      // Surround with | and add between columns
      colSpec = '|' + colSpec.split('').join('|') + '|';
    }
    let headerLine = '';
    let bodyLines: string[] = [];
    if (this.csvData && this.csvData.length > 0) {
      const start = this.csvHeaderFromFirstRow ? 1 : 0;
      if (this.includeHeader) {
        if (this.csvHeaderFromFirstRow) {
          headerLine = `${this.csvData[0].slice(0, this.columns).join(' & ')} \\`;
        } else {
          headerLine = `${this.headers.slice(0, this.columns).join(' & ')} \\`;
        }
      }
      for (let r = start; r < this.csvData.length; r++) {
        const row = this.csvData[r];
        bodyLines.push(`${Array.from({ length: this.columns }).map((_, i) => (row[i] ?? '')).join(' & ')} \\`);
      }
      if (bodyLines.length === 0) bodyLines.push(`${Array.from({ length: this.columns }).map(() => '').join(' & ')} \\`);
    } else {
      if (this.includeHeader) headerLine = `${this.headers.slice(0, this.columns).join(' & ')} \\`;
      const blank = `${Array.from({ length: this.columns }).map(() => '').join(' & ')} \\`;
      for (let i = 0; i < Math.max(1, this.rows); i++) bodyLines.push(blank);
    }
    // Rules
    const lines: string[] = [];
    if (this.latexUseBooktabs) {
      lines.push('\\toprule');
      if (headerLine) {
        lines.push(headerLine);
        lines.push('\\midrule');
      }
      lines.push(...bodyLines);
      lines.push('\\bottomrule');
    } else {
      if (this.latexUseHlines) {
        if (headerLine) lines.push('\\hline');
        if (headerLine) lines.push(headerLine);
        lines.push('\\hline');
        lines.push(...bodyLines);
        lines.push('\\hline');
      } else {
        if (headerLine) lines.push(headerLine);
        lines.push(...bodyLines);
      }
    }
    const body = lines.filter(Boolean).join('\n');
    const caption = this.caption ? `\n\\caption{${this.caption}}` : '';
    const label = this.label ? `\n\\label{tab:${this.label}}` : '';
    const centering = this.latexIncludeCentering ? '\\n\\centering' : '';
    return `\\begin{table}[htbp]${centering}\n\\begin{tabular}{${colSpec}}\n${body}\n\\end{tabular}${caption}${label}\n\\end{table}`;
  }

  private parseCSV(text: string): string[][] | null {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) return null;
    // detect delimiter by max occurrences of comma vs tab in first line
    const sample = lines[0];
    const commaCount = (sample.match(/,/g) || []).length;
    const tabCount = (sample.match(/\t/g) || []).length;
    const delim = tabCount > commaCount ? '\t' : ',';
    return lines.map((l) => l.split(new RegExp(delim)).map((s) => s.trim()));
  }

  private updatePreview() {
    if (!this.previewEl) return;
    const text = this.format === 'markdown' ? this.buildMarkdown() : this.buildLatex();
    this.previewEl.setText(text);
  }

  // Heuristic: numeric columns -> right alignment
  private guessAlignmentFromCSV() {
    if (!this.csvData || this.csvData.length === 0) return;
    const start = this.csvHeaderFromFirstRow ? 1 : 0;
    const cols = this.columns;
    const numRe = /^[-+]?\d+(?:[\.,]\d+)?%?$/;
    for (let c = 0; c < cols; c++) {
      let allNumeric = true;
      for (let r = start; r < this.csvData.length; r++) {
        const v = (this.csvData[r][c] || '').trim();
        if (!v) continue;
        if (!numRe.test(v)) { allNumeric = false; break; }
      }
      if (allNumeric) this.alignments[c] = 'right';
    }
  }
}
