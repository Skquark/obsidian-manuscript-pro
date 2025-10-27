/**
 * Research Bible Search Modal
 * Search and browse Research Bible entries
 */

import { App, Modal, MarkdownView, Notice } from 'obsidian';
import type ManuscriptProPlugin from '../main';
import type { ResearchFact, FactCategory } from '../quality/QualityInterfaces';

export class ResearchSearchModal extends Modal {
	private searchInput: HTMLInputElement;
	private categoryFilter: HTMLSelectElement;
	private resultsContainer: HTMLElement;
	private detailPane: HTMLElement;
	private selectedFact: ResearchFact | null = null;
	private allFacts: ResearchFact[] = [];

	constructor(
		app: App,
		private plugin: ManuscriptProPlugin,
	) {
		super(app);
		this.modalEl.addClass('research-search-modal');
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('research-search-modal-content');

		// Title
		contentEl.createEl('h2', { text: 'Research Bible Search' });

		// Load all facts
		this.loadFacts();

		// Search bar section
		const searchSection = contentEl.createDiv({ cls: 'research-search-section' });

		// Search input
		const searchContainer = searchSection.createDiv({ cls: 'research-search-input-container' });
		this.searchInput = searchContainer.createEl('input', {
			type: 'text',
			placeholder: 'Search terms, definitions, tags...',
			cls: 'research-search-input',
		});
		this.searchInput.focus();

		// Category filter
		const filterContainer = searchSection.createDiv({ cls: 'research-filter-container' });
		filterContainer.createEl('label', { text: 'Category: ' });
		this.categoryFilter = filterContainer.createEl('select', { cls: 'research-category-filter' });
		this.categoryFilter.createEl('option', { text: 'All', value: 'all' });
		this.categoryFilter.createEl('option', { text: 'Definition', value: 'definition' });
		this.categoryFilter.createEl('option', { text: 'Acronym', value: 'acronym' });
		this.categoryFilter.createEl('option', { text: 'Person', value: 'person' });
		this.categoryFilter.createEl('option', { text: 'Organization', value: 'organization' });
		this.categoryFilter.createEl('option', { text: 'Concept', value: 'concept' });
		this.categoryFilter.createEl('option', { text: 'Date', value: 'date' });
		this.categoryFilter.createEl('option', { text: 'Location', value: 'location' });
		this.categoryFilter.createEl('option', { text: 'Custom', value: 'custom' });

		// Main content area (split view)
		const mainContent = contentEl.createDiv({ cls: 'research-main-content' });

		// Results list
		const resultsSection = mainContent.createDiv({ cls: 'research-results-section' });
		resultsSection.createEl('h3', { text: 'Results' });
		this.resultsContainer = resultsSection.createDiv({ cls: 'research-results-list' });

		// Detail pane
		const detailSection = mainContent.createDiv({ cls: 'research-detail-section' });
		detailSection.createEl('h3', { text: 'Details' });
		this.detailPane = detailSection.createDiv({ cls: 'research-detail-pane' });

		// Footer
		const footer = contentEl.createDiv({ cls: 'research-footer' });

		const countEl = footer.createEl('span', { cls: 'research-count' });
		countEl.setText(`${this.allFacts.length} facts`);

		const buttonContainer = footer.createDiv({ cls: 'research-footer-buttons' });

		buttonContainer
			.createEl('button', {
				text: 'Add New',
				cls: 'mod-cta',
			})
			.addEventListener('click', () => {
				this.close();
				// Open the add fact modal
				const { ResearchFactModal } = require('./ResearchFactModal');
				new ResearchFactModal(this.app, this.plugin).open();
			});

		buttonContainer
			.createEl('button', {
				text: 'Close',
			})
			.addEventListener('click', () => {
				this.close();
			});

		// Event listeners
		this.searchInput.addEventListener('input', () => this.performSearch());
		this.categoryFilter.addEventListener('change', () => this.performSearch());

		// Initial render
		this.performSearch();
		this.renderEmptyDetail();
	}

	private loadFacts() {
		// Get all facts from Research Bible using public getters
		this.allFacts = this.plugin.researchBible.getFacts() || [];

		// Also include acronyms and terminology as facts
		const acronyms = this.plugin.researchBible.getAcronyms();
		acronyms.forEach((expansion, acronym) => {
			this.allFacts.push({
				id: `acronym-${acronym}`,
				category: 'acronym',
				term: acronym,
				definition: expansion,
				tags: [],
				lastUpdated: new Date(),
				references: [],
			});
		});

		const terminology = this.plugin.researchBible.getTerminology();
		terminology.forEach((definition, term) => {
			this.allFacts.push({
				id: `term-${term}`,
				category: 'definition',
				term: term,
				definition: definition,
				tags: [],
				lastUpdated: new Date(),
				references: [],
			});
		});

		const entities = this.plugin.researchBible.getEntities();
		entities.forEach((info, name) => {
			this.allFacts.push({
				id: `entity-${name}`,
				category: info.type as FactCategory,
				term: name,
				definition: info.description || '',
				tags: info.alternateNames || [],
				lastUpdated: new Date(),
				references: [],
			});
		});
	}

	private performSearch() {
		const query = this.searchInput.value.toLowerCase().trim();
		const category = this.categoryFilter.value;

		let results = this.allFacts;

		// Filter by category
		if (category !== 'all') {
			results = results.filter((fact) => fact.category === category);
		}

		// Filter by search query
		if (query) {
			results = results.filter((fact) => {
				const termMatch = fact.term.toLowerCase().includes(query);
				const defMatch = fact.definition.toLowerCase().includes(query);
				const tagMatch = fact.tags?.some((tag) => tag.toLowerCase().includes(query));
				const sourceMatch = fact.source?.toLowerCase().includes(query);
				return termMatch || defMatch || tagMatch || sourceMatch;
			});
		}

		this.renderResults(results);
	}

	private renderResults(results: ResearchFact[]) {
		this.resultsContainer.empty();

		if (results.length === 0) {
			this.resultsContainer.createEl('p', {
				text: 'No results found',
				cls: 'research-empty-state',
			});
			return;
		}

		results.forEach((fact) => {
			const resultItem = this.resultsContainer.createDiv({
				cls: 'research-result-item',
			});

			// Term (bold)
			const termEl = resultItem.createEl('div', {
				text: fact.term,
				cls: 'research-result-term',
			});

			// Category badge
			const badgeEl = resultItem.createEl('span', {
				text: fact.category,
				cls: `research-category-badge research-category-${fact.category}`,
			});

			// Definition preview
			const defPreview = fact.definition.substring(0, 100);
			const defEl = resultItem.createEl('div', {
				text: defPreview + (fact.definition.length > 100 ? '...' : ''),
				cls: 'research-result-definition',
			});

			// Tags
			if (fact.tags && fact.tags.length > 0) {
				const tagsContainer = resultItem.createDiv({ cls: 'research-result-tags' });
				fact.tags.slice(0, 3).forEach((tag) => {
					tagsContainer.createEl('span', {
						text: tag,
						cls: 'research-tag-badge',
					});
				});
			}

			// Click to select
			resultItem.addEventListener('click', () => {
				// Remove previous selection
				this.resultsContainer.querySelectorAll('.research-result-item').forEach((el) => el.removeClass('selected'));

				// Add selection to this item
				resultItem.addClass('selected');

				// Show details
				this.selectedFact = fact;
				this.renderDetail(fact);
			});
		});

		// Update count
		const countEl = this.contentEl.querySelector('.research-count');
		if (countEl) {
			countEl.setText(`Showing ${results.length} of ${this.allFacts.length} facts`);
		}
	}

	private renderEmptyDetail() {
		this.detailPane.empty();
		this.detailPane.createEl('p', {
			text: 'Select a fact to view details',
			cls: 'research-empty-detail',
		});
	}

	private renderDetail(fact: ResearchFact) {
		this.detailPane.empty();

		// Term
		this.detailPane.createEl('h4', { text: fact.term });

		// Category
		const categoryRow = this.detailPane.createDiv({ cls: 'research-detail-row' });
		categoryRow.createEl('strong', { text: 'Category: ' });
		categoryRow.createEl('span', {
			text: fact.category,
			cls: `research-category-badge research-category-${fact.category}`,
		});

		// Definition
		if (fact.definition) {
			const defRow = this.detailPane.createDiv({ cls: 'research-detail-row' });
			defRow.createEl('strong', { text: 'Definition:' });
			defRow.createEl('p', { text: fact.definition });
		}

		// Tags
		if (fact.tags && fact.tags.length > 0) {
			const tagsRow = this.detailPane.createDiv({ cls: 'research-detail-row' });
			tagsRow.createEl('strong', { text: 'Tags:' });
			const tagsContainer = tagsRow.createDiv({ cls: 'research-detail-tags' });
			fact.tags.forEach((tag) => {
				tagsContainer.createEl('span', {
					text: tag,
					cls: 'research-tag-badge',
				});
			});
		}

		// Source
		if (fact.source) {
			const sourceRow = this.detailPane.createDiv({ cls: 'research-detail-row' });
			sourceRow.createEl('strong', { text: 'Source:' });
			sourceRow.createEl('p', { text: fact.source });
		}

		// First mentioned
		if (fact.firstMentioned) {
			const firstRow = this.detailPane.createDiv({ cls: 'research-detail-row' });
			firstRow.createEl('strong', { text: 'First mentioned:' });
			firstRow.createEl('p', { text: fact.firstMentioned });
		}

		// Last updated
		const dateRow = this.detailPane.createDiv({ cls: 'research-detail-row' });
		dateRow.createEl('strong', { text: 'Last updated:' });
		dateRow.createEl('p', {
			text: new Date(fact.lastUpdated).toLocaleDateString(),
		});

		// Actions
		const actionsRow = this.detailPane.createDiv({
			cls: 'research-detail-actions',
		});

		actionsRow
			.createEl('button', {
				text: 'Insert into Document',
				cls: 'mod-cta',
			})
			.addEventListener('click', () => this.insertIntoDocument());

		actionsRow
			.createEl('button', {
				text: 'Copy Term',
			})
			.addEventListener('click', () => {
				navigator.clipboard.writeText(fact.term);
				new Notice('✓ Copied term to clipboard');
			});

		actionsRow
			.createEl('button', {
				text: 'Copy Definition',
			})
			.addEventListener('click', () => {
				navigator.clipboard.writeText(fact.definition);
				new Notice('✓ Copied definition to clipboard');
			});
	}

	private insertIntoDocument() {
		if (!this.selectedFact) return;

		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			new Notice('⚠ No active editor');
			return;
		}

		const cursor = view.editor.getCursor();
		const text = `**${this.selectedFact.term}**: ${this.selectedFact.definition}`;
		view.editor.replaceRange(text, cursor);

		new Notice(`✓ Inserted: ${this.selectedFact.term}`);
		this.close();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
