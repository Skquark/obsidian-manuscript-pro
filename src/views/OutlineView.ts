import { ItemView, WorkspaceLeaf, MarkdownView, Notice } from 'obsidian';

export const FOUNTAIN_OUTLINE_VIEW = 'fountain-outline-view';

export class OutlineView extends ItemView {
  getViewType(): string { return FOUNTAIN_OUTLINE_VIEW; }
  getDisplayText(): string { return 'Fountain Outline'; }

  async onOpen() {
    this.containerEl.empty();
    this.containerEl.addClass('fountain-outline');
    const header = this.containerEl.createEl('h3', { text: 'Scenes' });
    const list = this.containerEl.createEl('div', { cls: 'fountain-outline-list' });
    this.renderList(list);
    this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.renderList(list)));
    this.registerEvent(this.app.workspace.on('file-open', () => this.renderList(list)));
  }

  private renderList(container: HTMLElement) {
    container.empty();
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) { container.createEl('p', { text: 'No active file.' }); return; }
    const text = view.editor.getValue();
    const scenes: {line: number; title: string}[] = [];
    const lines = text.split(/\r?\n/);
    const sceneRe = /^(?:\.|INT\.|EXT\.|INT\.\/EXT\.|EST\.)\s*(.*)$/;
    lines.forEach((ln, idx) => {
      const m = ln.match(sceneRe);
      if (m) {
        const title = (m[0] || '').trim();
        scenes.push({ line: idx, title });
      }
    });
    if (scenes.length === 0) { container.createEl('p', { text: 'No scenes detected.' }); return; }
    const ul = container.createEl('ul');
    scenes.forEach((sc, idx) => {
      const li = ul.createEl('li');
      const a = li.createEl('a', { text: `${idx+1}. ${sc.title}` });
      a.onclick = () => {
        const v = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!v) return;
        v.editor.setCursor({ line: sc.line, ch: 0 });
        v.editor.scrollIntoView({ from: { line: sc.line, ch: 0 }, to: { line: sc.line + 1, ch: 0 } }, true);
      };
    });
  }
}
