/**
 * Label Browser Sidebar
 * Shows all labels in the vault with filtering and navigation
 */

import { ItemView, WorkspaceLeaf, Menu, MarkdownView, TFile, Notice } from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import type { LabelEntry, LabelType } from './CrossRefInterfaces';

export const LABEL_BROWSER_VIEW_TYPE = 'label-browser';

export class LabelBrowser extends ItemView {
	plugin: LatexPandocConcealerPlugin;
	private filterType: LabelType | 'all' = 'all';
	private searchQuery: string = '';

	constructor(leaf: WorkspaceLeaf, plugin: LatexPandocConcealerPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return LABEL_BROWSER_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Label Browser';
	}

	getIcon(): string {
		return 'tag';
	}

	async onOpen(): Promise<void> {
		await this.render();
	}

	async onClose(): Promise<void> {
		// Cleanup
	}

	/**
	 * Refresh the view
	 */
	async refresh(): Promise<void> {
		await this.render();
	}

	/**
	 * Render the label browser
	 */
	async render(): Promise<void> {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('label-browser-panel');

		// Header
		const header = contentEl.createDiv({ cls: 'label-browser-header' });
		header.createEl('h4', { text: 'Cross-References', cls: 'label-browser-title' });

		const buttonContainer = header.createDiv({ cls: 'label-browser-buttons' });

		const refreshBtn = buttonContainer.createEl('button', {
			text: '↻',
			cls: 'label-browser-refresh',
		});
		refreshBtn.title = 'Refresh labels';
		refreshBtn.onclick = async () => {
			await this.plugin.crossRefManager.indexVault();
			await this.refresh();
		};

		const closeBtn = buttonContainer.createEl('button', {
			text: '✕',
			cls: 'label-browser-close',
		});
		closeBtn.title = 'Close';
		closeBtn.onclick = () => {
			this.app.workspace.detachLeavesOfType(LABEL_BROWSER_VIEW_TYPE);
		};

		// Search box
		const searchContainer = contentEl.createDiv({ cls: 'label-browser-search' });
		const searchInput = searchContainer.createEl('input', {
			type: 'text',
			placeholder: 'Search labels...',
			cls: 'label-browser-search-input',
		});
		searchInput.value = this.searchQuery;
		searchInput.oninput = () => {
			this.searchQuery = searchInput.value;
			this.render();
		};

		// Filter by type
		const filterContainer = contentEl.createDiv({ cls: 'label-browser-filter' });
		filterContainer.createEl('span', { text: 'Type: ', cls: 'label-filter-label' });

		const filterSelect = filterContainer.createEl('select', { cls: 'label-filter-select' });
		const types: Array<LabelType | 'all'> = [
			'all',
			'section',
			'subsection',
			'figure',
			'table',
			'equation',
			'listing',
			'other',
		];

		types.forEach((type) => {
			const option = filterSelect.createEl('option', {
				value: type,
				text: type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1),
			});
			if (type === this.filterType) {
				option.selected = true;
			}
		});

		filterSelect.onchange = () => {
			this.filterType = filterSelect.value as LabelType | 'all';
			this.render();
		};

		// Statistics
		const stats = this.plugin.crossRefManager.getStats();
		const statsContainer = contentEl.createDiv({ cls: 'label-browser-stats' });
		statsContainer.createEl('span', {
			text: `${stats.totalLabels} labels, ${stats.totalReferences} references`,
			cls: 'label-stats-text',
		});

		// Label list
		const listContainer = contentEl.createDiv({ cls: 'label-browser-list' });

		let labels = this.plugin.crossRefManager.getAllLabels();

		// Apply filters
		if (this.filterType !== 'all') {
			labels = labels.filter((l) => l.type === this.filterType);
		}

		if (this.searchQuery) {
			const query = this.searchQuery.toLowerCase();
			labels = labels.filter((l) => l.key.toLowerCase().includes(query) || l.context.toLowerCase().includes(query));
		}

		// Sort by file then key
		labels.sort((a, b) => {
			if (a.file === b.file) {
				return a.key.localeCompare(b.key);
			}
			return a.file.localeCompare(b.file);
		});

		if (labels.length === 0) {
			listContainer.createEl('p', {
				text:
					this.searchQuery ?
						'No labels found matching your search.'
					:	'No labels found. Click refresh to index the vault.',
				cls: 'label-browser-empty',
			});
			return;
		}

		// Group by file
		const byFile: Record<string, LabelEntry[]> = {};
		labels.forEach((label) => {
			if (!byFile[label.file]) {
				byFile[label.file] = [];
			}
			byFile[label.file].push(label);
		});

		// Render grouped labels
		Object.entries(byFile).forEach(([file, fileLabels]) => {
			const fileGroup = listContainer.createDiv({ cls: 'label-file-group' });

			const fileHeader = fileGroup.createDiv({ cls: 'label-file-header' });
			fileHeader.createEl('span', {
				text: file,
				cls: 'label-file-name',
			});
			fileHeader.createEl('span', {
				text: `(${fileLabels.length})`,
				cls: 'label-file-count',
			});

			const labelList = fileGroup.createDiv({ cls: 'label-list' });

			fileLabels.forEach((label) => {
				const labelItem = labelList.createDiv({ cls: 'label-item' });

				const labelHeader = labelItem.createDiv({ cls: 'label-item-header' });

				const typeBadge = labelHeader.createEl('span', {
					cls: `label-type-badge label-type-${label.type}`,
					text: label.type.substring(0, 3).toUpperCase(),
				});

				const labelKey = labelHeader.createEl('span', {
					text: label.key,
					cls: 'label-key',
				});
				labelKey.onclick = () => this.jumpToLabel(label);

				const refCount = labelHeader.createEl('span', {
					text: `${label.references.length} refs`,
					cls: 'label-ref-count',
				});

				// Context preview
				if (label.context) {
					labelItem.createEl('div', {
						text: label.context.substring(0, 100) + '...',
						cls: 'label-context',
					});
				}

				// Metadata
				if (label.metadata?.sectionTitle) {
					labelItem.createEl('div', {
						text: `§ ${label.metadata.sectionTitle}`,
						cls: 'label-metadata',
					});
				}
				if (label.metadata?.figureCaption) {
					labelItem.createEl('div', {
						text: `📊 ${label.metadata.figureCaption}`,
						cls: 'label-metadata',
					});
				}

				// Context menu
				labelItem.oncontextmenu = (e) => {
					e.preventDefault();
					this.showLabelContextMenu(label, e);
				};
			});
		});
	}

	/**
	 * Jump to label definition
	 */
	private async jumpToLabel(label: LabelEntry): Promise<void> {
		const file = this.plugin.app.vault.getAbstractFileByPath(label.file);
		if (!file || !(file instanceof TFile)) return;

		const leaf = this.plugin.app.workspace.getLeaf(false);
		await leaf.openFile(file);

		// Set cursor position
		const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			view.editor.setCursor({
				line: label.position.line,
				ch: label.position.ch,
			});
			view.editor.scrollIntoView(
				{
					from: { line: label.position.line, ch: 0 },
					to: { line: label.position.line + 1, ch: 0 },
				},
				true,
			);
		}
	}

	/**
	 * Show context menu for label
	 */
	private showLabelContextMenu(label: LabelEntry, event: MouseEvent): void {
		const menu = new Menu();

		menu.addItem((item) => {
			item
				.setTitle('Jump to Definition')
				.setIcon('arrow-right')
				.onClick(() => this.jumpToLabel(label));
		});

		menu.addItem((item) => {
			item
				.setTitle('Copy Label Key')
				.setIcon('copy')
				.onClick(() => {
					navigator.clipboard.writeText(label.key);
				});
		});

		menu.addItem((item) => {
			item
				.setTitle('Copy as \\ref{}')
				.setIcon('code')
				.onClick(() => {
					navigator.clipboard.writeText(`\\ref{${label.key}}`);
				});
		});

		if (label.references.length > 0) {
			menu.addSeparator();
			menu.addItem((item) => {
				item
					.setTitle(`Show ${label.references.length} References`)
					.setIcon('links-coming-in')
					.onClick(() => {
						// Would show a list of all references
						console.log('References:', label.references);
					});
			});
		}

		menu.showAtMouseEvent(event);
	}
}
