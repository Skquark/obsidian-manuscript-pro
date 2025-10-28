import { ItemView, WorkspaceLeaf, Menu, setIcon, Notice, TFile } from 'obsidian';
import ManuscriptProPlugin from '../main';
import {
	ManuscriptStructure,
	Part,
	Chapter,
	Scene,
	OutlinerSettings,
	SceneStatus,
	ChapterStatus
} from './OutlinerInterfaces';
import { OutlinerManager } from './OutlinerManager';
import { SceneMetadataModal } from './SceneMetadataModal';

export const OUTLINER_VIEW_TYPE = 'manuscript-pro-outliner';

/**
 * Outliner panel for managing manuscript structure
 */
export class OutlinerPanel extends ItemView {
	private plugin: ManuscriptProPlugin;
	private manager: OutlinerManager;
	private currentManuscriptId: string | null = null;
	private expandedItems: Set<string> = new Set();

	// Drag-and-drop state
	private draggedItem: { type: 'scene' | 'chapter' | 'part'; id: string; parentId?: string } | null = null;
	private dropTarget: { type: 'scene' | 'chapter' | 'part'; id: string; position: 'before' | 'after' | 'inside' } | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: ManuscriptProPlugin, manager: OutlinerManager) {
		super(leaf);
		this.plugin = plugin;
		this.manager = manager;
	}

	getViewType(): string {
		return OUTLINER_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Manuscript Outliner';
	}

	getIcon(): string {
		return 'list-tree';
	}

	async onOpen(): Promise<void> {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('manuscript-pro-outliner-panel');

		// Load saved state
		const savedState = (this.plugin.settings as any).outlinerState;
		if (savedState) {
			this.currentManuscriptId = savedState.currentManuscriptId;
			this.expandedItems = new Set(savedState.expandedItems || []);
		}

		this.render();
	}

	async onClose(): Promise<void> {
		// Save state
		(this.plugin.settings as any).outlinerState = {
			currentManuscriptId: this.currentManuscriptId,
			expandedItems: Array.from(this.expandedItems)
		};
		await this.plugin.saveSettings();
	}

	/**
	 * Set current manuscript and refresh view
	 */
	setManuscript(manuscriptId: string): void {
		this.currentManuscriptId = manuscriptId;
		this.render();
	}

	/**
	 * Refresh the entire view
	 */
	refresh(): void {
		this.render();
	}

	/**
	 * Render the outliner view
	 */
	private render(): void {
		if (!this.contentEl) return;
		this.contentEl.empty();

		// Header
		this.renderHeader();

		// Manuscript selector
		this.renderManuscriptSelector();

		// Structure tree
		if (this.currentManuscriptId) {
			const structure = this.manager.getManuscript(this.currentManuscriptId);
			if (structure) {
				this.renderStructureTree(structure);
			} else {
				this.renderEmptyState('Manuscript not found');
			}
		} else {
			this.renderEmptyState('Select a manuscript to view its outline');
		}
	}

	/**
	 * Render header with actions
	 */
	private renderHeader(): void {
		const header = this.contentEl!.createDiv('outliner-header');

		const title = header.createEl('h3', { text: 'Manuscript Outliner' });
		title.addClass('outliner-title');

		const actions = header.createDiv('outliner-actions');

		// Add manuscript button
		const addBtn = actions.createEl('button', { cls: 'outliner-action-btn' });
		setIcon(addBtn, 'plus');
		addBtn.title = 'New manuscript';
		addBtn.addEventListener('click', () => this.createNewManuscript());

		// Export button
		const exportBtn = actions.createEl('button', { cls: 'outliner-action-btn' });
		setIcon(exportBtn, 'download');
		exportBtn.title = 'Export outline';
		exportBtn.addEventListener('click', (e) => this.showExportMenu(e));

		// Refresh button
		const refreshBtn = actions.createEl('button', { cls: 'outliner-action-btn' });
		setIcon(refreshBtn, 'refresh-cw');
		refreshBtn.title = 'Refresh';
		refreshBtn.addEventListener('click', () => this.refresh());

		// Settings button
		const settingsBtn = actions.createEl('button', { cls: 'outliner-action-btn' });
		setIcon(settingsBtn, 'settings');
		settingsBtn.title = 'Outliner settings';
		settingsBtn.addEventListener('click', () => this.showSettings());
	}

	/**
	 * Render manuscript selector dropdown
	 */
	private renderManuscriptSelector(): void {
		const manuscripts = this.manager.getAllManuscripts();
		if (manuscripts.length === 0) return;

		const selectorContainer = this.contentEl!.createDiv('outliner-manuscript-selector');

		const select = selectorContainer.createEl('select', { cls: 'dropdown' });
		select.addEventListener('change', (e) => {
			const target = e.target as HTMLSelectElement;
			this.setManuscript(target.value);
		});

		manuscripts.forEach(manuscript => {
			const option = select.createEl('option', {
				value: manuscript.id,
				text: `${manuscript.title} (${this.formatWordCount(manuscript.wordCount)})`
			});
			if (manuscript.id === this.currentManuscriptId) {
				option.selected = true;
			}
		});
	}

	/**
	 * Render the structure tree
	 */
	private renderStructureTree(structure: ManuscriptStructure): void {
		const treeContainer = this.contentEl!.createDiv('outliner-tree');

		// Structure info header
		const infoHeader = treeContainer.createDiv('outliner-info-header');
		infoHeader.createSpan({ text: structure.title, cls: 'outliner-manuscript-title' });
		infoHeader.createSpan({
			text: this.formatWordCount(structure.wordCount),
			cls: 'outliner-word-count'
		});

		// Add structure actions
		const structureActions = infoHeader.createDiv('outliner-structure-actions');
		const addBtn = structureActions.createEl('button', { cls: 'outliner-icon-btn' });
		setIcon(addBtn, 'plus');
		addBtn.title = structure.hasParts ? 'Add part' : 'Add chapter';
		addBtn.addEventListener('click', () => {
			if (structure.hasParts) {
				this.createNewPart(structure.id);
			} else {
				this.createNewChapter(structure.id);
			}
		});

		// Tree content
		const tree = treeContainer.createDiv('outliner-tree-content');

		if (structure.hasParts) {
			structure.parts
				.sort((a, b) => a.order - b.order)
				.forEach(part => this.renderPart(tree, structure.id, part));
		} else {
			structure.chapters
				.sort((a, b) => a.order - b.order)
				.forEach(chapter => this.renderChapter(tree, structure.id, chapter));
		}
	}

	/**
	 * Render a part
	 */
	private renderPart(container: HTMLElement, manuscriptId: string, part: Part): void {
		const partEl = container.createDiv('outliner-item outliner-part');
		partEl.setAttribute('data-part-id', part.id);
		const isExpanded = this.expandedItems.has(part.id);

		// Part header
		const header = partEl.createDiv('outliner-item-header');

		// Make draggable
		header.setAttribute('draggable', 'true');
		header.setAttribute('data-item-type', 'part');
		header.setAttribute('data-item-id', part.id);

		// Drag event handlers
		header.addEventListener('dragstart', (e) => this.onDragStart(e, 'part', part.id));
		header.addEventListener('dragover', (e) => this.onDragOver(e, 'part', part.id));
		header.addEventListener('drop', (e) => this.onDrop(e, manuscriptId));
		header.addEventListener('dragend', () => this.onDragEnd());

		// Expand/collapse icon
		const expandIcon = header.createDiv('outliner-expand-icon');
		setIcon(expandIcon, isExpanded ? 'chevron-down' : 'chevron-right');
		expandIcon.addEventListener('click', (e) => {
			e.stopPropagation(); // Prevent drag from triggering
			this.toggleExpand(part.id);
		});

		// Part icon
		const partIcon = header.createDiv('outliner-item-icon');
		setIcon(partIcon, 'book-open');

		// Part title
		const title = header.createDiv('outliner-item-title');
		title.textContent = part.title;

		// Part info
		const info = header.createDiv('outliner-item-info');
		info.createSpan({ text: `${part.chapters.length} ch.`, cls: 'outliner-chapter-count' });
		info.createSpan({ text: this.formatWordCount(part.wordCount), cls: 'outliner-word-count' });

		// Context menu
		header.addEventListener('contextmenu', (e) => {
			e.preventDefault();
			this.showPartContextMenu(e, manuscriptId, part);
		});

		// Chapters container
		if (isExpanded) {
			const chaptersContainer = partEl.createDiv('outliner-children');
			part.chapters
				.sort((a, b) => a.order - b.order)
				.forEach(chapter => this.renderChapter(chaptersContainer, manuscriptId, chapter, part.id));
		}
	}

	/**
	 * Render a chapter
	 */
	private renderChapter(container: HTMLElement, manuscriptId: string, chapter: Chapter, partId?: string): void {
		const chapterEl = container.createDiv('outliner-item outliner-chapter');
		const isExpanded = this.expandedItems.has(chapter.id);
		chapterEl.setAttribute('data-chapter-id', chapter.id);
		if (partId) {
			chapterEl.setAttribute('data-part-id', partId);
		}

		// Chapter header
		const header = chapterEl.createDiv('outliner-item-header');

		// Make draggable
		header.setAttribute('draggable', 'true');
		header.setAttribute('data-item-type', 'chapter');
		header.setAttribute('data-item-id', chapter.id);
		if (partId) {
			header.setAttribute('data-parent-id', partId);
		}

		// Drag event handlers
		header.addEventListener('dragstart', (e) => this.onDragStart(e, 'chapter', chapter.id, partId));
		header.addEventListener('dragover', (e) => this.onDragOver(e, 'chapter', chapter.id));
		header.addEventListener('drop', (e) => this.onDrop(e, manuscriptId));
		header.addEventListener('dragend', () => this.onDragEnd());

		// Expand/collapse icon
		const expandIcon = header.createDiv('outliner-expand-icon');
		setIcon(expandIcon, isExpanded ? 'chevron-down' : 'chevron-right');
		expandIcon.addEventListener('click', (e) => {
			e.stopPropagation(); // Prevent drag from triggering
			this.toggleExpand(chapter.id);
		});

		// Chapter icon
		const chapterIcon = header.createDiv('outliner-item-icon');
		setIcon(chapterIcon, 'file-text');

		// Chapter title
		const title = header.createDiv('outliner-item-title');
		title.textContent = chapter.title;

		// Status indicator
		const statusIndicator = header.createDiv('outliner-status-indicator');
		statusIndicator.addClass(`status-${chapter.status}`);
		statusIndicator.title = chapter.status;

		// Chapter info
		const info = header.createDiv('outliner-item-info');
		info.createSpan({ text: `${chapter.scenes.length} scenes`, cls: 'outliner-scene-count' });
		info.createSpan({ text: this.formatWordCount(chapter.wordCount), cls: 'outliner-word-count' });

		// Context menu
		header.addEventListener('contextmenu', (e) => {
			e.preventDefault();
			this.showChapterContextMenu(e, manuscriptId, chapter, partId);
		});

		// Scenes container
		if (isExpanded) {
			const scenesContainer = chapterEl.createDiv('outliner-children');
			chapter.scenes
				.sort((a, b) => a.order - b.order)
				.forEach(scene => this.renderScene(scenesContainer, manuscriptId, chapter.id, scene));
		}
	}

	/**
	 * Render a scene
	 */
	private renderScene(container: HTMLElement, manuscriptId: string, chapterId: string, scene: Scene): void {
		const sceneEl = container.createDiv('outliner-item outliner-scene');
		sceneEl.setAttribute('data-scene-id', scene.id);
		sceneEl.setAttribute('data-chapter-id', chapterId);

		// Scene header
		const header = sceneEl.createDiv('outliner-item-header');

		// Make draggable
		header.setAttribute('draggable', 'true');
		header.setAttribute('data-item-type', 'scene');
		header.setAttribute('data-item-id', scene.id);
		header.setAttribute('data-parent-id', chapterId);

		// Drag event handlers
		header.addEventListener('dragstart', (e) => this.onDragStart(e, 'scene', scene.id, chapterId));
		header.addEventListener('dragover', (e) => this.onDragOver(e, 'scene', scene.id));
		header.addEventListener('drop', (e) => this.onDrop(e, manuscriptId));
		header.addEventListener('dragend', () => this.onDragEnd());

		// Scene icon
		const sceneIcon = header.createDiv('outliner-item-icon');
		setIcon(sceneIcon, 'file-edit');

		// Scene title
		const title = header.createDiv('outliner-item-title');
		title.textContent = scene.title;

		// Status indicator
		const statusIndicator = header.createDiv('outliner-status-indicator');
		statusIndicator.addClass(`status-${scene.metadata.status}`);
		statusIndicator.title = scene.metadata.status;

		// Scene metadata
		if (scene.metadata.pov || scene.metadata.location) {
			const metadata = header.createDiv('outliner-scene-metadata');
			if (scene.metadata.pov) {
				metadata.createSpan({ text: scene.metadata.pov, cls: 'scene-pov' });
			}
			if (scene.metadata.location) {
				metadata.createSpan({ text: scene.metadata.location, cls: 'scene-location' });
			}
		}

		// Scene info
		const info = header.createDiv('outliner-item-info');
		info.createSpan({ text: this.formatWordCount(scene.wordCount), cls: 'outliner-word-count' });

		// Context menu
		header.addEventListener('contextmenu', (e) => {
			e.preventDefault();
			this.showSceneContextMenu(e, manuscriptId, chapterId, scene);
		});

		// Double-click to open file
		if (scene.file) {
			header.addEventListener('dblclick', () => {
				if (scene.file) {
					this.plugin.app.workspace.getLeaf(false).openFile(scene.file);
				}
			});
		}
	}

	/**
	 * Render empty state message
	 */
	private renderEmptyState(message: string): void {
		const empty = this.contentEl!.createDiv('outliner-empty-state');
		empty.createEl('p', { text: message });
		const createBtn = empty.createEl('button', { text: 'Create New Manuscript', cls: 'mod-cta' });
		createBtn.addEventListener('click', () => this.createNewManuscript());
	}

	/**
	 * Toggle expand/collapse state
	 */
	private toggleExpand(itemId: string): void {
		if (this.expandedItems.has(itemId)) {
			this.expandedItems.delete(itemId);
		} else {
			this.expandedItems.add(itemId);
		}
		this.render();
	}

	/**
	 * Format word count with commas
	 */
	private formatWordCount(count: number): string {
		return count.toLocaleString() + ' words';
	}

	// ========== DRAG AND DROP ==========

	/**
	 * Handle drag start
	 */
	private onDragStart(e: DragEvent, type: 'scene' | 'chapter' | 'part', id: string, parentId?: string): void {
		if (!e.dataTransfer) return;

		this.draggedItem = { type, id, parentId };

		// Set drag effect
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', id); // Required for Firefox

		// Add visual feedback
		const target = e.target as HTMLElement;
		target.classList.add('dragging');
	}

	/**
	 * Handle drag over - determine drop target
	 */
	private onDragOver(e: DragEvent, type: 'scene' | 'chapter' | 'part', id: string): void {
		if (!this.draggedItem) return;

		e.preventDefault();
		if (!e.dataTransfer) return;
		e.dataTransfer.dropEffect = 'move';

		// Don't allow dropping on itself
		if (this.draggedItem.id === id) {
			return;
		}

		// Determine drop position based on mouse position
		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const midpoint = rect.top + rect.height / 2;
		const position = e.clientY < midpoint ? 'before' : 'after';

		// Update drop target
		this.dropTarget = { type, id, position };

		// Add visual feedback
		this.updateDragFeedback(target, position);
	}

	/**
	 * Handle drop - execute the reorder
	 */
	private onDrop(e: DragEvent, manuscriptId: string): void {
		e.preventDefault();
		e.stopPropagation();

		if (!this.draggedItem || !this.dropTarget) return;

		// Can't drop item on itself
		if (this.draggedItem.id === this.dropTarget.id) {
			this.clearDragState();
			return;
		}

		// Calculate target order based on drop position
		const structure = this.manager.getManuscript(manuscriptId);
		if (!structure) return;

		// Get the target item to determine order
		let targetOrder = 0;
		let targetParentId: string | undefined;

		// Determine target parent and order based on item types
		if (this.draggedItem.type === 'scene') {
			// Dropping a scene - target should be another scene in the same or different chapter
			if (this.dropTarget.type === 'scene') {
				const targetScene = this.manager.getScene(manuscriptId, this.dropTarget.id);
				if (targetScene) {
					targetOrder = this.dropTarget.position === 'before' ? targetScene.order : targetScene.order + 1;
					// Find the chapter containing the target scene
					for (const chapter of structure.hasParts ? structure.parts.flatMap(p => p.chapters) : structure.chapters) {
						if (chapter.scenes.some(s => s.id === this.dropTarget!.id)) {
							targetParentId = chapter.id;
							break;
						}
					}
				}
			}
		} else if (this.draggedItem.type === 'chapter') {
			// Dropping a chapter
			if (this.dropTarget.type === 'chapter') {
				const targetChapter = this.manager.getChapter(manuscriptId, this.dropTarget.id);
				if (targetChapter) {
					targetOrder = this.dropTarget.position === 'before' ? targetChapter.order : targetChapter.order + 1;
					// If in a part-based structure, find the part
					if (structure.hasParts) {
						for (const part of structure.parts) {
							if (part.chapters.some(c => c.id === this.dropTarget!.id)) {
								targetParentId = part.id;
								break;
							}
						}
					}
				}
			}
		} else if (this.draggedItem.type === 'part') {
			// Dropping a part
			if (this.dropTarget.type === 'part') {
				const targetPart = this.manager.getPart(manuscriptId, this.dropTarget.id);
				if (targetPart) {
					targetOrder = this.dropTarget.position === 'before' ? targetPart.order : targetPart.order + 1;
				}
			}
		}

		// Execute the reorder via manager
		try {
			this.manager.handleDragDrop(manuscriptId, {
				type: this.draggedItem.type,
				itemId: this.draggedItem.id,
				sourceParentId: this.draggedItem.parentId,
				targetParentId,
				targetOrder
			});

			// Save and refresh
			this.plugin.saveSettings();
			this.render();
			new Notice(`${this.draggedItem.type} reordered`);
		} catch (error) {
			console.error('Drag-drop error:', error);
			new Notice('Failed to reorder item');
		}

		this.clearDragState();
	}

	/**
	 * Handle drag end - clean up
	 */
	private onDragEnd(): void {
		this.clearDragState();
	}

	/**
	 * Clear drag state and visual feedback
	 */
	private clearDragState(): void {
		this.draggedItem = null;
		this.dropTarget = null;

		// Remove all drag visual feedback
		this.contentEl.querySelectorAll('.dragging').forEach(el => {
			el.classList.remove('dragging');
		});
		this.contentEl.querySelectorAll('.drop-before, .drop-after').forEach(el => {
			el.classList.remove('drop-before', 'drop-after');
		});
	}

	/**
	 * Update visual feedback for drop target
	 */
	private updateDragFeedback(target: HTMLElement, position: 'before' | 'after'): void {
		// Remove existing feedback
		this.contentEl.querySelectorAll('.drop-before, .drop-after').forEach(el => {
			el.classList.remove('drop-before', 'drop-after');
		});

		// Add new feedback
		if (position === 'before') {
			target.classList.add('drop-before');
		} else {
			target.classList.add('drop-after');
		}
	}

	// ========== CONTEXT MENUS ==========

	/**
	 * Show export menu
	 */
	private showExportMenu(e: MouseEvent): void {
		const menu = new Menu();

		menu.addItem(item => item
			.setTitle('Export to Markdown')
			.setIcon('file-text')
			.onClick(() => this.exportToMarkdown())
		);

		menu.addItem(item => item
			.setTitle('Export to PDF')
			.setIcon('file-pdf')
			.onClick(() => this.exportToPDF())
		);

		menu.showAtMouseEvent(e);
	}

	/**
	 * Show part context menu
	 */
	private showPartContextMenu(e: MouseEvent, manuscriptId: string, part: Part): void {
		const menu = new Menu();

		menu.addItem(item => item
			.setTitle('Add chapter')
			.setIcon('plus')
			.onClick(() => this.createNewChapter(manuscriptId, part.id))
		);

		menu.addSeparator();

		// Bulk status update for all chapters
		if (part.chapters.length > 0) {
			menu.addItem(item => item
				.setTitle('Set all chapters status')
				.setIcon('check-circle')
			);

			menu.addItem(item => item
				.setTitle('  → Planned')
				.onClick(() => this.bulkUpdateChapterStatus(manuscriptId, part.id, 'planned'))
			);

			menu.addItem(item => item
				.setTitle('  → In Progress')
				.onClick(() => this.bulkUpdateChapterStatus(manuscriptId, part.id, 'in-progress'))
			);

			menu.addItem(item => item
				.setTitle('  → Complete')
				.onClick(() => this.bulkUpdateChapterStatus(manuscriptId, part.id, 'complete'))
			);

			menu.addSeparator();
		}

		menu.addItem(item => item
			.setTitle('Rename')
			.setIcon('pencil')
			.onClick(() => this.renamePart(manuscriptId, part.id))
		);

		menu.addItem(item => item
			.setTitle('Delete')
			.setIcon('trash')
			.onClick(() => this.deletePart(manuscriptId, part.id))
		);

		menu.showAtMouseEvent(e);
	}

	/**
	 * Show chapter context menu
	 */
	private showChapterContextMenu(e: MouseEvent, manuscriptId: string, chapter: Chapter, partId?: string): void {
		const menu = new Menu();

		menu.addItem(item => item
			.setTitle('Add scene')
			.setIcon('plus')
			.onClick(() => this.createNewScene(manuscriptId, chapter.id))
		);

		menu.addSeparator();

		// Bulk status update for all scenes
		if (chapter.scenes.length > 0) {
			menu.addItem(item => item
				.setTitle('Set all scenes status')
				.setIcon('check-circle')
			);

			menu.addItem(item => item
				.setTitle('  → Outline')
				.onClick(() => this.bulkUpdateSceneStatus(manuscriptId, chapter.id, 'outline'))
			);

			menu.addItem(item => item
				.setTitle('  → Draft')
				.onClick(() => this.bulkUpdateSceneStatus(manuscriptId, chapter.id, 'draft'))
			);

			menu.addItem(item => item
				.setTitle('  → Revision')
				.onClick(() => this.bulkUpdateSceneStatus(manuscriptId, chapter.id, 'revision'))
			);

			menu.addItem(item => item
				.setTitle('  → Complete')
				.onClick(() => this.bulkUpdateSceneStatus(manuscriptId, chapter.id, 'complete'))
			);

			menu.addSeparator();
		}

		menu.addItem(item => item
			.setTitle('Rename')
			.setIcon('pencil')
			.onClick(() => this.renameChapter(manuscriptId, chapter.id))
		);

		menu.addItem(item => item
			.setTitle('Delete')
			.setIcon('trash')
			.onClick(() => this.deleteChapter(manuscriptId, chapter.id))
		);

		menu.showAtMouseEvent(e);
	}

	/**
	 * Show scene context menu
	 */
	private showSceneContextMenu(e: MouseEvent, manuscriptId: string, chapterId: string, scene: Scene): void {
		const menu = new Menu();

		if (scene.file) {
			menu.addItem(item => item
				.setTitle('Open')
				.setIcon('file-edit')
				.onClick(() => {
					if (scene.file) {
						this.plugin.app.workspace.getLeaf(false).openFile(scene.file);
					}
				})
			);
			menu.addSeparator();
		}

		menu.addItem(item => item
			.setTitle('Edit metadata')
			.setIcon('settings')
			.onClick(() => this.editSceneMetadata(manuscriptId, scene.id))
		);

		menu.addItem(item => item
			.setTitle('Rename')
			.setIcon('pencil')
			.onClick(() => this.renameScene(manuscriptId, scene.id))
		);

		menu.addSeparator();

		// Status submenu
		menu.addItem(item => {
			const submenu = item
				.setTitle('Change status')
				.setIcon('check-circle');
			return submenu;
		});

		menu.addSeparator();

		menu.addItem(item => item
			.setTitle('Delete')
			.setIcon('trash')
			.onClick(() => this.deleteScene(manuscriptId, scene.id))
		);

		menu.showAtMouseEvent(e);
	}

	// ========== ACTIONS ==========

	private async createNewManuscript(): Promise<void> {
		const title = await this.promptForInput('New Manuscript', 'Enter manuscript title:');
		if (!title) return;

		const manuscript = this.manager.createManuscript(title, false);
		this.currentManuscriptId = manuscript.id;
		await this.plugin.saveSettings();
		this.render();
		new Notice('Manuscript created');
	}

	private async createNewPart(manuscriptId: string): Promise<void> {
		const title = await this.promptForInput('New Part', 'Enter part title:');
		if (!title) return;

		this.manager.createPart(manuscriptId, title);
		await this.plugin.saveSettings();
		this.render();
		new Notice('Part created');
	}

	private async createNewChapter(manuscriptId: string, partId?: string): Promise<void> {
		const title = await this.promptForInput('New Chapter', 'Enter chapter title:');
		if (!title) return;

		this.manager.createChapter(manuscriptId, title, partId);
		await this.plugin.saveSettings();
		this.render();
		new Notice('Chapter created');
	}

	private async createNewScene(manuscriptId: string, chapterId: string): Promise<void> {
		const title = await this.promptForInput('New Scene', 'Enter scene title:');
		if (!title) return;

		this.manager.createScene(manuscriptId, chapterId, title);
		await this.plugin.saveSettings();
		this.render();
		new Notice('Scene created');
	}

	private async renamePart(manuscriptId: string, partId: string): Promise<void> {
		const part = this.manager.getPart(manuscriptId, partId);
		if (!part) return;

		const newTitle = await this.promptForInput('Rename Part', 'Enter new title:', part.title);
		if (!newTitle) return;

		this.manager.updatePart(manuscriptId, partId, { title: newTitle });
		await this.plugin.saveSettings();
		this.render();
	}

	private async renameChapter(manuscriptId: string, chapterId: string): Promise<void> {
		const chapter = this.manager.getChapter(manuscriptId, chapterId);
		if (!chapter) return;

		const newTitle = await this.promptForInput('Rename Chapter', 'Enter new title:', chapter.title);
		if (!newTitle) return;

		this.manager.updateChapter(manuscriptId, chapterId, { title: newTitle });
		await this.plugin.saveSettings();
		this.render();
	}

	private async renameScene(manuscriptId: string, sceneId: string): Promise<void> {
		const scene = this.manager.getScene(manuscriptId, sceneId);
		if (!scene) return;

		const newTitle = await this.promptForInput('Rename Scene', 'Enter new title:', scene.title);
		if (!newTitle) return;

		this.manager.updateScene(manuscriptId, sceneId, { title: newTitle });
		await this.plugin.saveSettings();
		this.render();
	}

	private async deletePart(manuscriptId: string, partId: string): Promise<void> {
		const confirmed = confirm('Delete this part and all its chapters? This cannot be undone.');
		if (!confirmed) return;

		this.manager.deletePart(manuscriptId, partId);
		await this.plugin.saveSettings();
		this.render();
		new Notice('Part deleted');
	}

	private async deleteChapter(manuscriptId: string, chapterId: string): Promise<void> {
		const confirmed = confirm('Delete this chapter and all its scenes? This cannot be undone.');
		if (!confirmed) return;

		this.manager.deleteChapter(manuscriptId, chapterId);
		await this.plugin.saveSettings();
		this.render();
		new Notice('Chapter deleted');
	}

	private async deleteScene(manuscriptId: string, sceneId: string): Promise<void> {
		const confirmed = confirm('Delete this scene? This cannot be undone.');
		if (!confirmed) return;

		this.manager.deleteScene(manuscriptId, sceneId);
		await this.plugin.saveSettings();
		this.render();
		new Notice('Scene deleted');
	}

	private editSceneMetadata(manuscriptId: string, sceneId: string): void {
		new SceneMetadataModal(
			this.app,
			this.manager,
			manuscriptId,
			sceneId,
			async () => {
				await this.plugin.saveSettings();
				this.render();
			}
		).open();
	}

	private showSettings(): void {
		// Open plugin settings to outliner section
		new Notice('Outliner settings - configure in plugin settings');
	}

	/**
	 * Bulk update all scenes in a chapter to a specific status
	 */
	private async bulkUpdateSceneStatus(manuscriptId: string, chapterId: string, status: SceneStatus): Promise<void> {
		const chapter = this.manager.getChapter(manuscriptId, chapterId);
		if (!chapter) return;

		const count = chapter.scenes.length;
		const confirmed = confirm(`Set all ${count} scenes to "${status}"?`);
		if (!confirmed) return;

		// Update all scenes
		chapter.scenes.forEach(scene => {
			this.manager.updateScene(manuscriptId, scene.id, {
				metadata: {
					...scene.metadata,
					status
				}
			});
		});

		await this.plugin.saveSettings();
		this.render();
		new Notice(`Updated ${count} scenes to "${status}"`);
	}

	/**
	 * Bulk update all chapters in a part to a specific status
	 */
	private async bulkUpdateChapterStatus(manuscriptId: string, partId: string, status: ChapterStatus): Promise<void> {
		const part = this.manager.getPart(manuscriptId, partId);
		if (!part) return;

		const count = part.chapters.length;
		const confirmed = confirm(`Set all ${count} chapters to "${status}"?`);
		if (!confirmed) return;

		// Update all chapters
		part.chapters.forEach(chapter => {
			this.manager.updateChapter(manuscriptId, chapter.id, {
				status
			});
		});

		await this.plugin.saveSettings();
		this.render();
		new Notice(`Updated ${count} chapters to "${status}"`);
	}

	/**
	 * Simple input prompt
	 */
	private async promptForInput(title: string, placeholder: string, defaultValue?: string): Promise<string | null> {
		return new Promise((resolve) => {
			const input = prompt(title + '\n' + placeholder, defaultValue || '');
			resolve(input);
		});
	}

	// ========== EXPORT ==========

	/**
	 * Export current manuscript outline to markdown
	 */
	private async exportToMarkdown(): Promise<void> {
		if (!this.currentManuscriptId) {
			new Notice('No manuscript selected');
			return;
		}

		const structure = this.manager.getManuscript(this.currentManuscriptId);
		if (!structure) {
			new Notice('Manuscript not found');
			return;
		}

		// Generate markdown
		let markdown = `# ${structure.title}\n\n`;
		markdown += `**Total Word Count:** ${this.formatWordCount(structure.wordCount)}\n\n`;
		markdown += `---\n\n`;

		if (structure.hasParts) {
			// Manuscript with parts
			structure.parts
				.sort((a, b) => a.order - b.order)
				.forEach((part, index) => {
					markdown += this.partToMarkdown(part, index + 1);
				});
		} else {
			// Manuscript without parts
			structure.chapters
				.sort((a, b) => a.order - b.order)
				.forEach((chapter, index) => {
					markdown += this.chapterToMarkdown(chapter, index + 1);
				});
		}

		// Create or update export file
		const filename = `${structure.title.replace(/[^a-zA-Z0-9]/g, '_')}_outline.md`;
		const path = filename;

		try {
			await this.app.vault.create(path, markdown);
			new Notice(`Outline exported to ${filename}`);

			// Open the file
			const file = this.app.vault.getAbstractFileByPath(path);
			if (file instanceof TFile) {
				this.app.workspace.getLeaf(false).openFile(file);
			}
		} catch (error) {
			// File might already exist, try to modify it
			const file = this.app.vault.getAbstractFileByPath(path);
			if (file instanceof TFile) {
				await this.app.vault.modify(file, markdown);
				new Notice(`Outline updated in ${filename}`);
				this.app.workspace.getLeaf(false).openFile(file);
			} else {
				console.error('Export error:', error);
				new Notice('Failed to export outline');
			}
		}
	}

	/**
	 * Convert part to markdown
	 */
	private partToMarkdown(part: Part, partNum: number): string {
		let md = `## Part ${partNum}: ${part.title}\n\n`;
		md += `**Word Count:** ${this.formatWordCount(part.wordCount)}\n`;
		md += `**Chapters:** ${part.chapters.length}\n\n`;

		part.chapters
			.sort((a, b) => a.order - b.order)
			.forEach((chapter, index) => {
				md += this.chapterToMarkdown(chapter, index + 1, partNum);
			});

		return md + '\n';
	}

	/**
	 * Convert chapter to markdown
	 */
	private chapterToMarkdown(chapter: Chapter, chapterNum: number, partNum?: number): string {
		const prefix = partNum ? `${partNum}.${chapterNum}` : `${chapterNum}`;
		let md = `### Chapter ${prefix}: ${chapter.title}\n\n`;
		md += `**Status:** ${chapter.status}\n`;
		md += `**Word Count:** ${this.formatWordCount(chapter.wordCount)}\n`;
		md += `**Scenes:** ${chapter.scenes.length}\n\n`;

		if (chapter.scenes.length > 0) {
			md += `#### Scenes\n\n`;
			chapter.scenes
				.sort((a, b) => a.order - b.order)
				.forEach((scene, index) => {
					md += this.sceneToMarkdown(scene, index + 1);
				});
		}

		return md + '\n';
	}

	/**
	 * Convert scene to markdown
	 */
	private sceneToMarkdown(scene: Scene, sceneNum: number): string {
		let md = `##### Scene ${sceneNum}: ${scene.title}\n\n`;

		// Scene metadata table
		md += `| Property | Value |\n`;
		md += `|----------|-------|\n`;
		md += `| **Status** | ${scene.metadata.status} |\n`;
		md += `| **Word Count** | ${this.formatWordCount(scene.wordCount)} |\n`;

		if (scene.metadata.pov) {
			md += `| **POV** | ${scene.metadata.pov} |\n`;
		}
		if (scene.metadata.location) {
			md += `| **Location** | ${scene.metadata.location} |\n`;
		}
		if (scene.metadata.timeOfDay) {
			md += `| **Time of Day** | ${scene.metadata.timeOfDay} |\n`;
		}
		if (scene.metadata.dateInStory) {
			md += `| **Story Date** | ${scene.metadata.dateInStory} |\n`;
		}
		if (scene.metadata.tone) {
			md += `| **Tone** | ${scene.metadata.tone} |\n`;
		}
		if (scene.metadata.plotThreads && scene.metadata.plotThreads.length > 0) {
			md += `| **Plot Threads** | ${scene.metadata.plotThreads.join(', ')} |\n`;
		}
		if (scene.file) {
			md += `| **File** | [[${scene.file.path}]] |\n`;
		}

		md += `\n`;

		if (scene.summary) {
			md += `**Summary:** ${scene.summary}\n\n`;
		}

		if (scene.notes) {
			md += `**Notes:** ${scene.notes}\n\n`;
		}

		return md;
	}

	/**
	 * Export current manuscript outline to PDF via Pandoc
	 */
	private async exportToPDF(): Promise<void> {
		if (!this.currentManuscriptId) {
			new Notice('No manuscript selected');
			return;
		}

		const structure = this.manager.getManuscript(this.currentManuscriptId);
		if (!structure) {
			new Notice('Manuscript not found');
			return;
		}

		// Check if Pandoc is configured
		if (!this.plugin.settings.export?.pandocPath) {
			new Notice('Pandoc not configured. Please set Pandoc path in plugin settings.');
			return;
		}

		try {
			// Generate markdown
			let markdown = `# ${structure.title}\n\n`;
			markdown += `**Total Word Count:** ${this.formatWordCount(structure.wordCount)}\n\n`;
			markdown += `---\n\n`;

			if (structure.hasParts) {
				structure.parts
					.sort((a, b) => a.order - b.order)
					.forEach((part, index) => {
						markdown += this.partToMarkdown(part, index + 1);
					});
			} else {
				structure.chapters
					.sort((a, b) => a.order - b.order)
					.forEach((chapter, index) => {
						markdown += this.chapterToMarkdown(chapter, index + 1);
					});
			}

			// Create temporary markdown file
			const tempMdFilename = `${structure.title.replace(/[^a-zA-Z0-9]/g, '_')}_outline_temp.md`;
			const tempMdPath = tempMdFilename;

			await this.app.vault.create(tempMdPath, markdown);

			// Get the file
			const tempFile = this.app.vault.getAbstractFileByPath(tempMdPath);
			if (!(tempFile instanceof TFile)) {
				new Notice('Failed to create temporary file');
				return;
			}

			// Use the ExportManager to export to PDF
			const outputFilename = `${structure.title.replace(/[^a-zA-Z0-9]/g, '_')}_outline.pdf`;

			new Notice('Exporting to PDF... This may take a moment.');

			// The export manager expects a TFile and profile
			// We'll use a basic PDF profile
			const pdfProfile = {
				id: 'outline-pdf',
				name: 'Outline PDF',
				format: 'pdf',
				pandocArgs: [
					'-V', 'geometry:margin=1in',
					'-V', 'fontsize=12pt',
					'--pdf-engine=xelatex'
				],
				outputExtension: 'pdf'
			};

			// Get the ExportManager
			const exportManager = (this.plugin as any).exportManager;
			if (!exportManager) {
				new Notice('Export manager not available');
				// Clean up temp file
				await this.app.vault.delete(tempFile);
				return;
			}

			// Export using the manager
			await exportManager.exportFile(tempFile, pdfProfile, outputFilename);

			// Clean up temporary markdown file
			await this.app.vault.delete(tempFile);

			new Notice(`Outline exported to ${outputFilename}`);
		} catch (error) {
			console.error('PDF export error:', error);
			new Notice('Failed to export outline to PDF: ' + (error as Error).message);
		}
	}
}
