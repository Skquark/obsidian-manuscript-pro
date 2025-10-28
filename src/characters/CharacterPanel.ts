import { ItemView, WorkspaceLeaf, Menu, setIcon, Notice } from 'obsidian';
import ManuscriptProPlugin from '../main';
import { Character, CharacterRole, CharacterImportance } from './CharacterInterfaces';
import { CharacterManager } from './CharacterManager';
import { CharacterProfileModal } from './CharacterProfileModal';
import { CharacterExporter } from './CharacterExporter';
import { CharacterExportDialog } from './CharacterExportDialog';

export const CHARACTER_VIEW_TYPE = 'manuscript-pro-characters';

/**
 * Character database panel
 */
export class CharacterPanel extends ItemView {
	private plugin: ManuscriptProPlugin;
	private manager: CharacterManager;
	private searchQuery: string = '';
	private sortBy: 'name' | 'role' | 'importance' | 'appearances' | 'recent' = 'name';
	private filterRole?: CharacterRole;
	private filterImportance?: CharacterImportance;

	constructor(leaf: WorkspaceLeaf, plugin: ManuscriptProPlugin, manager: CharacterManager) {
		super(leaf);
		this.plugin = plugin;
		this.manager = manager;
	}

	getViewType(): string {
		return CHARACTER_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Character Database';
	}

	getIcon(): string {
		return 'users';
	}

	async onOpen(): Promise<void> {
		this.render();
	}

	async onClose(): Promise<void> {
		// Cleanup if needed
	}

	/**
	 * Refresh the view
	 */
	refresh(): void {
		this.render();
	}

	/**
	 * Render the character panel
	 */
	private render(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('manuscript-pro-character-panel');

		// Header
		this.renderHeader();

		// Search and filters
		this.renderSearchBar();
		this.renderFilters();

		// Character list
		this.renderCharacterList();

		// Statistics (footer)
		this.renderStatistics();
	}

	/**
	 * Render header with actions
	 */
	private renderHeader(): void {
		const header = this.contentEl.createDiv('character-header');

		const title = header.createEl('h3', { text: 'Characters', cls: 'character-title' });

		const actions = header.createDiv('character-actions');

		// Add character button
		const addBtn = actions.createEl('button', { cls: 'character-action-btn' });
		setIcon(addBtn, 'plus');
		addBtn.title = 'New character';
		addBtn.addEventListener('click', () => this.createNewCharacter());

		// Sort menu button
		const sortBtn = actions.createEl('button', { cls: 'character-action-btn' });
		setIcon(sortBtn, 'arrow-up-down');
		sortBtn.title = 'Sort characters';
		sortBtn.addEventListener('click', (e) => this.showSortMenu(e));

		// Export button
		const exportBtn = actions.createEl('button', { cls: 'character-action-btn' });
		setIcon(exportBtn, 'download');
		exportBtn.title = 'Export characters';
		exportBtn.addEventListener('click', () => this.exportCharacters());

		// Refresh button
		const refreshBtn = actions.createEl('button', { cls: 'character-action-btn' });
		setIcon(refreshBtn, 'refresh-cw');
		refreshBtn.title = 'Refresh';
		refreshBtn.addEventListener('click', () => this.refresh());
	}

	/**
	 * Render search bar
	 */
	private renderSearchBar(): void {
		const searchContainer = this.contentEl.createDiv('character-search-container');

		const searchInput = searchContainer.createEl('input', {
			type: 'text',
			placeholder: 'Search characters...',
			cls: 'character-search-input'
		});

		searchInput.value = this.searchQuery;
		searchInput.addEventListener('input', (e) => {
			this.searchQuery = (e.target as HTMLInputElement).value;
			this.renderCharacterList();
		});

		// Clear button
		if (this.searchQuery) {
			const clearBtn = searchContainer.createEl('button', { cls: 'character-search-clear' });
			setIcon(clearBtn, 'x');
			clearBtn.addEventListener('click', () => {
				this.searchQuery = '';
				searchInput.value = '';
				this.renderCharacterList();
			});
		}
	}

	/**
	 * Render filter chips
	 */
	private renderFilters(): void {
		if (!this.filterRole && !this.filterImportance) return;

		const filtersContainer = this.contentEl.createDiv('character-filters-container');

		if (this.filterRole) {
			const chip = filtersContainer.createDiv('character-filter-chip');
			chip.createSpan({ text: `Role: ${this.filterRole}` });
			const removeBtn = chip.createSpan({ cls: 'character-filter-remove' });
			setIcon(removeBtn, 'x');
			removeBtn.addEventListener('click', () => {
				this.filterRole = undefined;
				this.render();
			});
		}

		if (this.filterImportance) {
			const chip = filtersContainer.createDiv('character-filter-chip');
			chip.createSpan({ text: `Importance: ${this.filterImportance}` });
			const removeBtn = chip.createSpan({ cls: 'character-filter-remove' });
			setIcon(removeBtn, 'x');
			removeBtn.addEventListener('click', () => {
				this.filterImportance = undefined;
				this.render();
			});
		}
	}

	/**
	 * Render character list
	 */
	private renderCharacterList(): void {
		// Remove old list if it exists
		const oldList = this.contentEl.querySelector('.character-list-container');
		if (oldList) oldList.remove();

		const listContainer = this.contentEl.createDiv('character-list-container');

		// Get characters
		let characters = this.manager.getAllCharacters();

		// Apply search
		if (this.searchQuery.trim()) {
			const results = this.manager.searchCharacters(this.searchQuery);
			characters = results.map(r => r.character);
		} else {
			// Apply filters
			if (this.filterRole || this.filterImportance) {
				characters = this.manager.filterCharacters({
					role: this.filterRole,
					importance: this.filterImportance
				});
			}

			// Sort
			characters = this.manager.sortCharacters(characters, this.sortBy);
		}

		// Render characters
		if (characters.length === 0) {
			this.renderEmptyState(listContainer);
		} else {
			characters.forEach(character => {
				this.renderCharacterCard(listContainer, character);
			});
		}
	}

	/**
	 * Render a character card
	 */
	private renderCharacterCard(container: HTMLElement, character: Character): void {
		const card = container.createDiv('character-card');
		card.setAttribute('data-character-id', character.id);

		// Header
		const cardHeader = card.createDiv('character-card-header');

		// Color indicator
		if (character.color) {
			const colorDot = cardHeader.createDiv('character-color-dot');
			colorDot.style.backgroundColor = character.color;
		}

		// Name
		const name = cardHeader.createDiv('character-name');
		name.textContent = character.name;

		// Role badge
		const roleBadge = cardHeader.createDiv('character-role-badge');
		roleBadge.textContent = character.role;
		roleBadge.addClass(`role-${character.role}`);

		// Tagline
		if (character.tagline) {
			const tagline = card.createDiv('character-tagline');
			tagline.textContent = character.tagline;
		}

		// Metadata
		const metadata = card.createDiv('character-metadata');

		// Importance
		const importanceIcon = metadata.createSpan({ cls: 'character-meta-item' });
		setIcon(importanceIcon, 'star');
		metadata.createSpan({ text: character.importance, cls: 'character-meta-text' });

		// Appearances count
		if (character.appearances && character.appearances.length > 0) {
			const appearanceIcon = metadata.createSpan({ cls: 'character-meta-item' });
			setIcon(appearanceIcon, 'file-text');
			metadata.createSpan({
				text: `${character.appearances.length} scenes`,
				cls: 'character-meta-text'
			});
		}

		// Relationships count
		if (character.relationships && character.relationships.length > 0) {
			const relationIcon = metadata.createSpan({ cls: 'character-meta-item' });
			setIcon(relationIcon, 'users');
			metadata.createSpan({
				text: `${character.relationships.length} relationships`,
				cls: 'character-meta-text'
			});
		}

		// Click to view details
		card.addEventListener('click', () => this.viewCharacterProfile(character.id));

		// Context menu
		card.addEventListener('contextmenu', (e) => {
			e.preventDefault();
			this.showCharacterContextMenu(e, character);
		});
	}

	/**
	 * Render empty state
	 */
	private renderEmptyState(container: HTMLElement): void {
		const empty = container.createDiv('character-empty-state');

		if (this.searchQuery.trim()) {
			empty.createEl('p', { text: 'No characters found' });
		} else {
			empty.createEl('p', { text: 'No characters yet' });
			const createBtn = empty.createEl('button', {
				text: 'Create First Character',
				cls: 'mod-cta'
			});
			createBtn.addEventListener('click', () => this.createNewCharacter());
		}
	}

	/**
	 * Render statistics footer
	 */
	private renderStatistics(): void {
		const stats = this.manager.getStatistics();
		const footer = this.contentEl.createDiv('character-statistics');

		footer.createSpan({
			text: `${stats.totalCharacters} total`,
			cls: 'character-stat-item'
		});

		if (stats.mostFrequentCharacter) {
			footer.createSpan({
				text: `Most scenes: ${stats.mostFrequentCharacter.name}`,
				cls: 'character-stat-item'
			});
		}
	}

	// ========== MENUS ==========

	/**
	 * Show sort menu
	 */
	private showSortMenu(e: MouseEvent): void {
		const menu = new Menu();

		menu.addItem(item => item
			.setTitle('Sort by Name')
			.setIcon('sort-asc')
			.setChecked(this.sortBy === 'name')
			.onClick(() => {
				this.sortBy = 'name';
				this.render();
			})
		);

		menu.addItem(item => item
			.setTitle('Sort by Role')
			.setIcon('users')
			.setChecked(this.sortBy === 'role')
			.onClick(() => {
				this.sortBy = 'role';
				this.render();
			})
		);

		menu.addItem(item => item
			.setTitle('Sort by Importance')
			.setIcon('star')
			.setChecked(this.sortBy === 'importance')
			.onClick(() => {
				this.sortBy = 'importance';
				this.render();
			})
		);

		menu.addItem(item => item
			.setTitle('Sort by Appearances')
			.setIcon('file-text')
			.setChecked(this.sortBy === 'appearances')
			.onClick(() => {
				this.sortBy = 'appearances';
				this.render();
			})
		);

		menu.addItem(item => item
			.setTitle('Sort by Recent')
			.setIcon('clock')
			.setChecked(this.sortBy === 'recent')
			.onClick(() => {
				this.sortBy = 'recent';
				this.render();
			})
		);

		menu.showAtMouseEvent(e);
	}

	/**
	 * Show character context menu
	 */
	private showCharacterContextMenu(e: MouseEvent, character: Character): void {
		const menu = new Menu();

		menu.addItem(item => item
			.setTitle('View Profile')
			.setIcon('user')
			.onClick(() => this.viewCharacterProfile(character.id))
		);

		menu.addSeparator();

		menu.addItem(item => item
			.setTitle('Quick Edit')
			.setIcon('pencil')
			.onClick(() => this.quickEditCharacter(character.id))
		);

		menu.addItem(item => item
			.setTitle('Delete')
			.setIcon('trash')
			.onClick(() => this.deleteCharacter(character.id))
		);

		menu.showAtMouseEvent(e);
	}

	// ========== ACTIONS ==========

	private async createNewCharacter(): Promise<void> {
		const name = await this.promptForInput('New Character', 'Enter character name:');
		if (!name) return;

		this.manager.createCharacter(name, 'other', 'minor');
		await this.plugin.saveSettings();
		this.refresh();
		new Notice('Character created');
	}

	private viewCharacterProfile(characterId: string): void {
		new CharacterProfileModal(
			this.app,
			this.manager,
			characterId,
			async () => {
				await this.plugin.saveSettings();
				this.refresh();
			}
		).open();
	}

	private quickEditCharacter(characterId: string): void {
		// Quick edit modal - simpler than full profile
		new Notice('Quick edit - coming soon');
	}

	private async deleteCharacter(characterId: string): Promise<void> {
		const character = this.manager.getCharacter(characterId);
		if (!character) return;

		const confirmed = confirm(`Delete character "${character.name}"? This cannot be undone.`);
		if (!confirmed) return;

		this.manager.deleteCharacter(characterId);
		await this.plugin.saveSettings();
		this.refresh();
		new Notice('Character deleted');
	}

	/**
	 * Export characters
	 */
	private exportCharacters(): void {
		const exporter = new CharacterExporter(this.app, this.manager);
		new CharacterExportDialog(this.app, exporter).open();
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
}
