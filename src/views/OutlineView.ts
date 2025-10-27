import { ItemView, MarkdownView } from 'obsidian';

export const FOUNTAIN_OUTLINE_VIEW = 'fountain-outline-view';

export class OutlineView extends ItemView {
	getViewType(): string {
		return FOUNTAIN_OUTLINE_VIEW;
	}
	getDisplayText(): string {
		return 'Fountain Outline';
	}

	private filterTOD: Set<string> = new Set();

	async onOpen() {
		this.containerEl.empty();
		this.containerEl.addClass('fountain-outline');
		this.containerEl.createEl('h3', { text: 'Scenes' });
		const controls = this.containerEl.createDiv({ cls: 'fountain-outline-controls' });
		const addToggle = (label: string) => {
			const btn = controls.createEl('button', { text: label });
			btn.onclick = () => {
				if (this.filterTOD.has(label)) this.filterTOD.delete(label);
				else this.filterTOD.add(label);
				this.renderList(list);
				btn.classList.toggle('is-active');
			};
		};
		addToggle('DAY');
		addToggle('NIGHT');
		const list = this.containerEl.createEl('div', { cls: 'fountain-outline-list' });
		this.renderList(list);
		this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.renderList(list)));
		this.registerEvent(this.app.workspace.on('file-open', () => this.renderList(list)));
	}

	private renderList(container: HTMLElement) {
		container.empty();
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			container.createEl('p', { text: 'No active file.' });
			return;
		}
		const text = view.editor.getValue();
		const scenes: { line: number; title: string; tod?: string }[] = [];
		const lines = text.split(/\r?\n/);
		const sceneRe = /^(?:\.|INT\.|EXT\.|INT\.\/EXT\.|EST\.)\s*(.*)$/;
		lines.forEach((ln, idx) => {
			const m = ln.match(sceneRe);
			if (m) {
				const title = (m[0] || '').trim();
				const tod = title.split(' - ').slice(1).join(' - ').trim().toUpperCase();
				const todKey = tod ? tod : undefined;
				scenes.push({ line: idx, title, tod: todKey });
			}
		});
		let filtered = scenes;
		if (this.filterTOD.size > 0) {
			filtered = scenes.filter((s) => {
				if (!s.tod) return false;
				for (const k of this.filterTOD) if (s.tod.includes(k)) return true;
				return false;
			});
		}
		const titleEl = this.containerEl.querySelector('h3');
		if (titleEl) titleEl.textContent = `Scenes (${filtered.length})`;
		if (filtered.length === 0) {
			container.createEl('p', { text: 'No scenes detected.' });
			return;
		}
		const ul = container.createEl('ul');
		filtered.forEach((sc, idx) => {
			const li = ul.createEl('li');
			const a = li.createEl('a', { text: `${idx + 1}. ${sc.title}` });
			a.onclick = () => {
				const v = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!v) return;
				v.editor.setCursor({ line: sc.line, ch: 0 });
				v.editor.scrollIntoView({ from: { line: sc.line, ch: 0 }, to: { line: sc.line + 1, ch: 0 } }, true);
			};
		});
	}
}
