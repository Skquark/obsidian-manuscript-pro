/**
 * Manuscript Navigator Sidebar View
 * Displays book structure as a tree with navigation and statistics
 */

import { ItemView, WorkspaceLeaf, TFile, Menu, Notice } from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import { ManuscriptConfigManager } from './ManuscriptConfig';
import type { TreeNode, ChapterStats } from './ManuscriptInterfaces';

export const MANUSCRIPT_NAVIGATOR_VIEW_TYPE = 'manuscript-navigator';

export class ManuscriptNavigator extends ItemView {
	private configManager: ManuscriptConfigManager;
	private chapterStats: Map<string, ChapterStats> = new Map();
	private refreshTimeout: number | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		private plugin: LatexPandocConcealerPlugin,
	) {
		super(leaf);
		this.configManager = new ManuscriptConfigManager(plugin);
	}

	getViewType(): string {
		return MANUSCRIPT_NAVIGATOR_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Manuscript Navigator';
	}

	getIcon(): string {
		return 'book-open';
	}

	async onOpen(): Promise<void> {
		this.contentEl.empty();
		this.contentEl.addClass('manuscript-navigator-view');

		await this.render();

		// Register file change listener for auto-refresh
		if (this.plugin.settings.manuscriptNavigator.autoRefreshStats) {
			this.registerEvent(
				this.plugin.app.vault.on('modify', (file) => {
					if (file instanceof TFile && file.extension === 'md') {
						this.scheduleRefresh();
					}
				}),
			);
		}
	}

	async onClose(): Promise<void> {
		if (this.refreshTimeout) {
			window.clearTimeout(this.refreshTimeout);
		}
	}

	/**
	 * Schedule a refresh with debouncing
	 */
	private scheduleRefresh(): void {
		if (this.refreshTimeout) {
			window.clearTimeout(this.refreshTimeout);
		}

		this.refreshTimeout = window.setTimeout(() => {
			this.render();
		}, 2000); // 2 second debounce
	}

	/**
	 * Main render method
	 */
	async render(): Promise<void> {
		this.contentEl.empty();

		// Load configuration
		const loaded = await this.configManager.load();

		if (!loaded) {
			this.renderEmptyState();
			return;
		}

		// Render components
		this.renderHeader();
		await this.renderManuscriptStats();
		this.renderSearchFilter();
		this.renderTreeView();
	}

	/**
	 * Render empty state when no book.json found
	 */
	private renderEmptyState(): void {
		const emptyContainer = this.containerEl.createDiv({ cls: 'manuscript-empty-state' });

		emptyContainer.createEl('h3', { text: 'No Manuscript Project Found' });
		emptyContainer.createEl('p', {
			text: `Create a ${this.plugin.settings.manuscriptNavigator.configFile} file to define your manuscript structure.`,
		});

		const exampleText = emptyContainer.createEl('p', {
			text: 'Example structure:',
			cls: 'empty-state-example-label',
		});

		const exampleCode = emptyContainer.createEl('pre', { cls: 'empty-state-example' });
		exampleCode.textContent = `{
  "version": "1.0",
  "metadata": {
    "title": "My Book",
    "author": "Author Name"
  },
  "structure": {
    "chapters": [
      {
        "id": "chapter-1",
        "title": "Introduction",
        "file": "chapters/01-intro.md",
        "included": true,
        "order": 1
      }
    ]
  }
}`;

		const buttonContainer = emptyContainer.createDiv({ cls: 'empty-state-buttons' });

		const createButton = buttonContainer.createEl('button', {
			text: 'Create Sample Project',
			cls: 'mod-cta',
		});

		createButton.addEventListener('click', async () => {
			await this.createSampleProject();
			await this.render();
		});

		const docsButton = buttonContainer.createEl('button', {
			text: 'View Documentation',
		});

		docsButton.addEventListener('click', () => {
			window.open('https://github.com/yourusername/obsidian-latex-pandoc-concealer#manuscript-navigator', '_blank');
		});
	}

	/**
	 * Render header with title and settings button
	 */
	private renderHeader(): void {
		const header = this.containerEl.createDiv({ cls: 'manuscript-navigator-header' });

		const config = this.configManager.getConfig();
		const title = config?.metadata?.title || 'Manuscript Navigator';

		const titleEl = header.createEl('h2', { text: title });
		titleEl.title = 'Click to refresh';
		titleEl.addEventListener('click', () => {
			this.render();
			new Notice('Manuscript statistics refreshed');
		});

		const settingsButton = header.createEl('button', {
			cls: 'manuscript-settings-button',
			attr: { 'aria-label': 'Settings' },
		});
		settingsButton.innerHTML = '⚙️';
		settingsButton.addEventListener('click', () => {
			// Open settings to manuscript section
			(this.plugin.app as any).setting.open();
			(this.plugin.app as any).setting.openTabById(this.plugin.manifest.id);
		});
	}

	/**
	 * Render manuscript-wide statistics
	 */
	private async renderManuscriptStats(): Promise<void> {
		const statsContainer = this.containerEl.createDiv({ cls: 'manuscript-stats-summary' });

		// Calculate stats
		const config = this.configManager.getConfig();
		if (!config) return;

		const allChapters = config.structure.chapters || [];
		const includedChapters = allChapters.filter((c) => c.included);

		// Calculate word counts
		let totalWords = 0;
		let includedWords = 0;
		let totalFigures = 0;
		let totalCitations = 0;

		for (const chapter of allChapters) {
			const stats = await this.getChapterStats(chapter.id, chapter.file);
			if (stats) {
				totalWords += stats.wordCount;
				totalFigures += stats.figureCount;
				totalCitations += stats.citationCount;

				if (chapter.included) {
					includedWords += stats.wordCount;
				}
			}
		}

		// Display stats
		const totalWordsEl = statsContainer.createDiv({ cls: 'stat-item stat-total-words' });
		totalWordsEl.innerHTML = `📊 Total: <strong>${totalWords.toLocaleString()}</strong> words`;

		const chapterInfo = statsContainer.createDiv({ cls: 'stat-item stat-chapter-info' });
		chapterInfo.innerHTML = `${allChapters.length} chapters (${includedChapters.length} included)`;

		if (this.plugin.settings.manuscriptNavigator.showFigureCount) {
			const figuresInfo = statsContainer.createDiv({ cls: 'stat-item stat-figures' });
			figuresInfo.innerHTML = `📊 ${totalFigures} figures`;
		}

		if (this.plugin.settings.manuscriptNavigator.showCitationCount) {
			const citationsInfo = statsContainer.createDiv({ cls: 'stat-item stat-citations' });
			citationsInfo.innerHTML = `📚 ${totalCitations} citations`;
		}

		// Progress bar if goal is set
		const goal = this.plugin.settings.manuscriptNavigator.totalWordGoal;
		if (goal && goal > 0) {
			const progress = (includedWords / goal) * 100;
			const progressBar = statsContainer.createDiv({ cls: 'manuscript-progress' });

			const barContainer = progressBar.createDiv({ cls: 'progress-bar-container' });
			const barFill = barContainer.createDiv({ cls: 'progress-bar-fill' });
			barFill.style.width = `${Math.min(progress, 100)}%`;

			// Color based on progress
			if (progress >= 100) {
				barFill.style.background = 'var(--color-green)';
			} else if (progress >= 75) {
				barFill.style.background = 'linear-gradient(to right, #4caf50, #8bc34a)';
			} else if (progress >= 50) {
				barFill.style.background = 'var(--color-yellow)';
			} else {
				barFill.style.background = 'var(--color-orange)';
			}

			const progressText = progressBar.createDiv({ cls: 'progress-text' });
			progressText.textContent = `${progress.toFixed(1)}% of ${goal.toLocaleString()} word goal`;
		}
	}

	/**
	 * Render search/filter bar
	 */
	private renderSearchFilter(): void {
		const filterContainer = this.containerEl.createDiv({ cls: 'manuscript-filter' });

		const searchInput = filterContainer.createEl('input', {
			type: 'text',
			placeholder: '🔍 Search chapters...',
			cls: 'manuscript-search-input',
		});

		searchInput.addEventListener('input', (e) => {
			const query = (e.target as HTMLInputElement).value.toLowerCase();
			this.filterTree(query);
		});
	}

	/**
	 * Render tree view of chapters and parts
	 */
	private renderTreeView(): void {
		const treeContainer = this.containerEl.createDiv({ cls: 'manuscript-tree-view' });

		const nodes = this.configManager.getStructuredChapters();

		if (nodes.length === 0) {
			const emptyTree = treeContainer.createDiv({ cls: 'tree-empty' });
			emptyTree.textContent = 'No chapters defined in manuscript structure';
			return;
		}

		for (const node of nodes) {
			this.renderNode(treeContainer, node, 0);
		}
	}

	/**
	 * Render a single tree node (part or chapter)
	 */
	private renderNode(container: HTMLElement, node: TreeNode, depth: number): void {
		const nodeEl = container.createDiv({
			cls: `tree-node tree-node-${node.type} tree-depth-${depth}`,
			attr: { 'data-node-id': node.id },
		});

		if (node.type === 'part') {
			this.renderPartNode(nodeEl, node, depth);
		} else {
			this.renderChapterNode(nodeEl, node, depth);
		}
	}

	/**
	 * Render a part node with children
	 */
	private renderPartNode(container: HTMLElement, node: TreeNode, depth: number): void {
		const partHeader = container.createDiv({ cls: 'part-header' });

		const toggleIcon = partHeader.createSpan({ cls: 'collapse-icon' });
		toggleIcon.textContent = node.collapsed ? '▶' : '▼';

		const partTitle = partHeader.createSpan({ cls: 'part-title' });
		partTitle.textContent = `📁 ${node.title}`;

		partHeader.addEventListener('click', () => {
			this.configManager.setPartCollapsed(node.id, !node.collapsed);
			this.render();
		});

		// Render children if not collapsed
		if (!node.collapsed && node.children && node.children.length > 0) {
			const childrenContainer = container.createDiv({ cls: 'part-children' });
			for (const child of node.children) {
				this.renderNode(childrenContainer, child, depth + 1);
			}
		}
	}

	/**
	 * Render a chapter node
	 */
	private renderChapterNode(container: HTMLElement, node: TreeNode, depth: number): void {
		const chapterEl = container.createDiv({ cls: 'chapter-node' });

		// Inclusion checkbox
		const checkbox = chapterEl.createEl('input', {
			type: 'checkbox',
			cls: 'chapter-checkbox',
		});
		checkbox.checked = node.included ?? true;
		checkbox.addEventListener('change', async (e) => {
			e.stopPropagation();
			await this.configManager.toggleChapterInclusion(node.id);
			await this.render();
		});

		// Chapter icon and title
		const titleContainer = chapterEl.createSpan({ cls: 'chapter-title-container' });

		const icon = titleContainer.createSpan({ cls: 'chapter-icon' });
		icon.textContent = node.type === 'backmatter' ? '📑' : '📄';

		const titleEl = titleContainer.createSpan({ cls: 'chapter-title' });
		titleEl.textContent = node.title;

		// Add stats if available and enabled
		if (this.plugin.settings.manuscriptNavigator.showWordCount && node.file) {
			this.getChapterStats(node.id, node.file).then((stats) => {
				if (stats) {
					const wordCount = chapterEl.createSpan({ cls: 'chapter-word-count' });
					wordCount.textContent = `(${stats.wordCount.toLocaleString()})`;

					// Color code based on goal
					const goal = this.plugin.settings.manuscriptNavigator.defaultChapterWordGoal;
					if (goal && goal > 0) {
						if (stats.wordCount >= goal) {
							wordCount.addClass('word-count-at-goal');
						} else if (stats.wordCount >= goal * 0.75) {
							wordCount.addClass('word-count-near-goal');
						} else {
							wordCount.addClass('word-count-below-goal');
						}
					}
				}
			});
		}

		// Click to open file
		chapterEl.addEventListener('click', async (e) => {
			if ((e.target as HTMLElement).classList.contains('chapter-checkbox')) {
				return; // Don't open file if clicking checkbox
			}

			if (node.file) {
				const file = this.plugin.app.vault.getAbstractFileByPath(node.file);
				if (file instanceof TFile) {
					const newPane = e.ctrlKey || e.metaKey;
					const leaf = this.plugin.app.workspace.getLeaf(newPane);
					await leaf.openFile(file);
				} else {
					new Notice(`File not found: ${node.file}`);
				}
			}
		});

		// Right-click context menu
		chapterEl.addEventListener('contextmenu', (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.showChapterContextMenu(node, e);
		});

		// Highlight active chapter
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (activeFile && activeFile.path === node.file) {
			chapterEl.addClass('active-chapter');
		}

		// Gray out if excluded
		if (!node.included) {
			chapterEl.addClass('excluded-chapter');
		}
	}

	/**
	 * Show context menu for chapter
	 */
	private showChapterContextMenu(node: TreeNode, event: MouseEvent): void {
		const menu = new Menu();

		menu.addItem((item) => {
			item
				.setTitle('Open in New Pane')
				.setIcon('go-to-file')
				.onClick(async () => {
					if (node.file) {
						const file = this.plugin.app.vault.getAbstractFileByPath(node.file);
						if (file instanceof TFile) {
							const leaf = this.plugin.app.workspace.getLeaf('split');
							await leaf.openFile(file);
						}
					}
				});
		});

		menu.addSeparator();

		menu.addItem((item) => {
			item
				.setTitle(node.included ? 'Exclude from Build' : 'Include in Build')
				.setIcon(node.included ? 'x' : 'check')
				.onClick(async () => {
					await this.configManager.toggleChapterInclusion(node.id);
					await this.render();
				});
		});

		menu.addSeparator();

		menu.addItem((item) => {
			item
				.setTitle('Rename Chapter')
				.setIcon('pencil')
				.onClick(() => {
					this.promptRenameChapter(node);
				});
		});

		menu.addItem((item) => {
			item
				.setTitle('Chapter Details')
				.setIcon('info')
				.onClick(async () => {
					await this.showChapterDetails(node);
				});
		});

		menu.showAtMouseEvent(event);
	}

	/**
	 * Prompt to rename a chapter
	 */
	private promptRenameChapter(node: TreeNode): void {
		const newTitle = prompt('Enter new chapter title:', node.title);
		if (newTitle && newTitle !== node.title) {
			this.configManager.updateChapterTitle(node.id, newTitle);
			this.render();
			new Notice(`Chapter renamed to "${newTitle}"`);
		}
	}

	/**
	 * Show detailed stats modal for chapter
	 */
	private async showChapterDetails(node: TreeNode): Promise<void> {
		if (!node.file) return;

		const stats = await this.getChapterStats(node.id, node.file);
		if (!stats) {
			new Notice('Could not load chapter statistics');
			return;
		}

		const details = `Chapter: ${node.title}
File: ${node.file}
Status: ${node.included ? 'Included' : 'Excluded'}

Statistics:
• Word count: ${stats.wordCount.toLocaleString()}
• Figures: ${stats.figureCount}
• Tables: ${stats.tableCount}
• Citations: ${stats.citationCount}
• Equations: ${stats.equationCount}

Last modified: ${new Date(stats.lastModified).toLocaleString()}`;

		// Simple alert for now (could be a modal in future)
		alert(details);
	}

	/**
	 * Filter tree view by search query
	 */
	private filterTree(query: string): void {
		const treeNodes = this.containerEl.querySelectorAll('.tree-node');

		if (!query) {
			// Show all nodes
			treeNodes.forEach((nodeEl) => {
				(nodeEl as HTMLElement).style.display = '';
			});
			return;
		}

		treeNodes.forEach((nodeEl) => {
			const titleEl = nodeEl.querySelector('.chapter-title, .part-title');
			const title = titleEl?.textContent?.toLowerCase() || '';

			if (title.includes(query)) {
				(nodeEl as HTMLElement).style.display = '';
			} else {
				(nodeEl as HTMLElement).style.display = 'none';
			}
		});
	}

	/**
	 * Get or calculate chapter statistics
	 */
	private async getChapterStats(chapterId: string, filePath: string): Promise<ChapterStats | null> {
		// Check cache first
		if (this.chapterStats.has(chapterId)) {
			const cached = this.chapterStats.get(chapterId)!;
			// Cache valid for 5 minutes
			if (Date.now() - cached.lastModified < 5 * 60 * 1000 && cached.cached) {
				return cached;
			}
		}

		// Calculate new stats
		const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
		if (!(file instanceof TFile)) {
			return null;
		}

		const content = await this.plugin.app.vault.read(file);

		// Use existing StatsCalculator if available
		const { StatsCalculator } = await import('../stats/StatsCalculator');
		const calculator = new StatsCalculator(content, this.plugin.settings);
		const manuscriptStats = calculator.calculateAll();

		const stats: ChapterStats = {
			chapterId,
			wordCount: manuscriptStats.wordCount.total,
			figureCount: manuscriptStats.structure.figures,
			tableCount: manuscriptStats.structure.tables,
			citationCount: manuscriptStats.citations.total,
			equationCount: manuscriptStats.structure.equations,
			lastModified: file.stat.mtime,
			cached: true,
		};

		this.chapterStats.set(chapterId, stats);
		return stats;
	}

	/**
	 * Create a sample manuscript project
	 */
	private async createSampleProject(): Promise<void> {
		const configPath = this.plugin.settings.manuscriptNavigator.configFile;

		const sampleConfig = {
			version: '1.0',
			metadata: {
				title: 'Sample Manuscript',
				author: 'Author Name',
			},
			structure: {
				chapters: [
					{
						id: 'chapter-1',
						title: 'Introduction',
						file: 'chapters/01-introduction.md',
						included: true,
						order: 1,
					},
					{
						id: 'chapter-2',
						title: 'Background',
						file: 'chapters/02-background.md',
						included: true,
						order: 2,
					},
				],
			},
			settings: {
				wordCountGoals: {
					chapter: 5000,
					total: 50000,
				},
			},
		};

		try {
			// Create config file
			await this.plugin.app.vault.create(configPath, JSON.stringify(sampleConfig, null, 2));

			// Create sample chapter files if they don't exist
			const chaptersFolder = 'chapters';

			// Create chapters folder
			try {
				await this.plugin.app.vault.createFolder(chaptersFolder);
			} catch (e) {
				// Folder might already exist
			}

			// Create sample chapters
			const chapter1 = `# Introduction

This is the introduction chapter of your manuscript.

\\label{sec:introduction}

## Background

Some background information here.`;

			const chapter2 = `# Background

This chapter provides background information.

\\label{sec:background}

## Related Work

Discussion of related work.`;

			try {
				await this.plugin.app.vault.create(`${chaptersFolder}/01-introduction.md`, chapter1);
			} catch (e) {
				// File might already exist
			}

			try {
				await this.plugin.app.vault.create(`${chaptersFolder}/02-background.md`, chapter2);
			} catch (e) {
				// File might already exist
			}

			new Notice('Sample manuscript project created!');
		} catch (error) {
			console.error('Failed to create sample project:', error);
			new Notice(`Failed to create sample project: ${error.message}`);
		}
	}

	/**
	 * Get the current manuscript structure
	 * Used by ExportManager to get all chapters in order
	 */
	getStructure() {
		const config = this.configManager.getConfig();
		return config?.structure;
	}
}
