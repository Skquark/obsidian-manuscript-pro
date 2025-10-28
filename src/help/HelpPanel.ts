import { ItemView, WorkspaceLeaf, MarkdownRenderer, setIcon } from 'obsidian';
import ManuscriptProPlugin from '../main';
import {
	HELP_CATEGORIES,
	HELP_TOPICS,
	getTopicsByCategory,
	getTopicById,
	searchTopics,
	getRelatedTopics,
	type HelpTopic,
	type HelpCategory,
} from './HelpContent';

export const HELP_PANEL_VIEW_TYPE = 'manuscript-pro-help-panel';

/**
 * Help panel view with searchable content and category navigation
 */
export class HelpPanel extends ItemView {
	plugin: ManuscriptProPlugin;
	private currentTopic: HelpTopic | null = null;
	private currentCategory: HelpCategory | null = null;
	private searchQuery = '';

	// UI Elements
	private searchInput!: HTMLInputElement;
	private categoryContainer!: HTMLElement;
	private topicListContainer!: HTMLElement;
	private contentContainer!: HTMLElement;

	constructor(leaf: WorkspaceLeaf, plugin: ManuscriptProPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return HELP_PANEL_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Manuscript Pro Help';
	}

	getIcon(): string {
		return 'help-circle';
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass('mp-help-panel');

		// Create main layout
		this.createHeader(container);
		this.createMainContent(container);
		this.addStyles();

		// Listen for requests to open specific topics (from tooltips, etc.)
		const handleOpenTopic = (evt: Event) => {
			const customEvt = evt as CustomEvent;
			const topicId = customEvt.detail?.topicId;
			if (topicId) {
				const topic = getTopicById(topicId);
				if (topic) {
					this.showTopic(topic);
				}
			}
		};
		window.addEventListener('mp-open-help-topic', handleOpenTopic);
		this.register(() => window.removeEventListener('mp-open-help-topic', handleOpenTopic));

		// Show welcome topic by default
		const welcomeTopic = getTopicById('welcome');
		if (welcomeTopic) {
			this.showTopic(welcomeTopic);
		} else {
			this.renderTopicList();
		}
	}

	private createHeader(container: Element): void {
		const header = container.createDiv({ cls: 'mp-help-header' });

		// Title
		const titleContainer = header.createDiv({ cls: 'mp-help-title' });
		const icon = titleContainer.createSpan({ cls: 'mp-help-icon' });
		setIcon(icon, 'help-circle');
		titleContainer.createEl('h2', { text: 'Help & Documentation' });

		// Search bar
		const searchContainer = header.createDiv({ cls: 'mp-help-search' });
		this.searchInput = searchContainer.createEl('input', {
			type: 'text',
			placeholder: 'Search help topics... (press / to focus)',
			cls: 'mp-help-search-input',
		});

		this.searchInput.addEventListener('input', () => {
			this.searchQuery = this.searchInput.value;
			this.renderTopicList();
		});

		// Keyboard shortcut: / to focus search
		this.registerDomEvent(document, 'keydown', (evt: KeyboardEvent) => {
			if (evt.key === '/' && !this.isInputFocused()) {
				evt.preventDefault();
				this.searchInput.focus();
			}
		});
	}

	private createMainContent(container: Element): void {
		const mainContent = container.createDiv({ cls: 'mp-help-main' });

		// Sidebar with categories
		const sidebar = mainContent.createDiv({ cls: 'mp-help-sidebar' });
		this.categoryContainer = sidebar.createDiv({ cls: 'mp-help-categories' });
		this.renderCategories();

		// Content area
		const contentArea = mainContent.createDiv({ cls: 'mp-help-content-area' });

		// Topic list
		this.topicListContainer = contentArea.createDiv({ cls: 'mp-help-topic-list' });

		// Topic content viewer
		this.contentContainer = contentArea.createDiv({ cls: 'mp-help-topic-content' });
	}

	private renderCategories(): void {
		this.categoryContainer.empty();

		// "All Topics" category
		const allButton = this.categoryContainer.createDiv({
			cls: 'mp-help-category-button' + (this.currentCategory === null ? ' is-active' : ''),
		});
		const allIcon = allButton.createSpan({ cls: 'mp-help-category-icon' });
		allIcon.textContent = '📚';
		allButton.createSpan({ text: 'All Topics', cls: 'mp-help-category-name' });

		allButton.addEventListener('click', () => {
			this.currentCategory = null;
			this.renderCategories();
			this.renderTopicList();
		});

		// Category buttons
		HELP_CATEGORIES.forEach((category) => {
			const button = this.categoryContainer.createDiv({
				cls:
					'mp-help-category-button' +
					(this.currentCategory === category.id ? ' is-active' : ''),
			});

			const icon = button.createSpan({ cls: 'mp-help-category-icon' });
			icon.textContent = category.icon;

			button.createSpan({ text: category.name, cls: 'mp-help-category-name' });

			const topicCount = getTopicsByCategory(category.id).length;
			button.createSpan({ text: `${topicCount}`, cls: 'mp-help-category-count' });

			button.addEventListener('click', () => {
				this.currentCategory = category.id;
				this.renderCategories();
				this.renderTopicList();
			});
		});
	}

	private renderTopicList(): void {
		this.topicListContainer.empty();

		// Get topics based on search and category filter
		let topics: HelpTopic[] = [];

		if (this.searchQuery) {
			topics = searchTopics(this.searchQuery);
			if (this.currentCategory) {
				topics = topics.filter((t) => t.category === this.currentCategory);
			}
		} else if (this.currentCategory) {
			topics = getTopicsByCategory(this.currentCategory);
		} else {
			topics = HELP_TOPICS;
		}

		// Show message if no topics found
		if (topics.length === 0) {
			const emptyState = this.topicListContainer.createDiv({ cls: 'mp-help-empty-state' });
			emptyState.createEl('p', { text: 'No help topics found' });
			if (this.searchQuery) {
				emptyState.createEl('p', {
					text: `Try a different search term`,
					cls: 'mp-help-empty-hint',
				});
			}
			return;
		}

		// Show topic count
		const header = this.topicListContainer.createDiv({ cls: 'mp-help-list-header' });
		let headerText = `${topics.length} topic${topics.length === 1 ? '' : 's'}`;
		if (this.searchQuery) {
			headerText += ` matching "${this.searchQuery}"`;
		} else if (this.currentCategory) {
			const catInfo = HELP_CATEGORIES.find((c) => c.id === this.currentCategory);
			headerText += ` in ${catInfo?.name}`;
		}
		header.createEl('div', { text: headerText, cls: 'mp-help-list-count' });

		// Render topic cards
		const topicGrid = this.topicListContainer.createDiv({ cls: 'mp-help-topic-grid' });

		topics.forEach((topic) => {
			const card = topicGrid.createDiv({ cls: 'mp-help-topic-card' });

			// Topic header
			const cardHeader = card.createDiv({ cls: 'mp-help-topic-card-header' });

			// Category icon
			const categoryInfo = HELP_CATEGORIES.find((c) => c.id === topic.category);
			if (categoryInfo) {
				const catIcon = cardHeader.createSpan({ cls: 'mp-help-topic-category-icon' });
				catIcon.textContent = categoryInfo.icon;
			}

			// Title
			cardHeader.createEl('h3', { text: topic.title, cls: 'mp-help-topic-card-title' });

			// Level badge
			const levelBadge = card.createDiv({ cls: `mp-help-level-badge level-${topic.level}` });
			levelBadge.textContent = topic.level;

			// Tags
			if (topic.tags.length > 0) {
				const tagsContainer = card.createDiv({ cls: 'mp-help-topic-tags' });
				topic.tags.slice(0, 3).forEach((tag) => {
					tagsContainer.createSpan({ text: tag, cls: 'mp-help-tag' });
				});
			}

			// Keyboard shortcut if available
			if (topic.keyboardShortcut) {
				const kbdContainer = card.createDiv({ cls: 'mp-help-topic-kbd' });
				kbdContainer.createEl('kbd', { text: topic.keyboardShortcut });
			}

			// Click to view topic
			card.addEventListener('click', () => {
				this.showTopic(topic);
			});
		});
	}

	private async showTopic(topic: HelpTopic): Promise<void> {
		this.currentTopic = topic;
		this.contentContainer.empty();
		this.contentContainer.addClass('is-visible');

		// Back button and breadcrumb
		const breadcrumb = this.contentContainer.createDiv({ cls: 'mp-help-breadcrumb' });

		const backButton = breadcrumb.createEl('button', { cls: 'mp-help-back-button' });
		const backIcon = backButton.createSpan();
		setIcon(backIcon, 'arrow-left');
		backButton.createSpan({ text: 'Back to topics' });

		backButton.addEventListener('click', () => {
			this.contentContainer.removeClass('is-visible');
			this.currentTopic = null;
		});

		// Category badge
		const categoryInfo = HELP_CATEGORIES.find((c) => c.id === topic.category);
		if (categoryInfo) {
			const categoryBadge = breadcrumb.createDiv({ cls: 'mp-help-category-badge' });
			categoryBadge.textContent = `${categoryInfo.icon} ${categoryInfo.name}`;
		}

		// Topic header
		const topicHeader = this.contentContainer.createDiv({ cls: 'mp-help-topic-header' });
		topicHeader.createEl('h1', { text: topic.title });

		const metaContainer = topicHeader.createDiv({ cls: 'mp-help-topic-meta' });

		// Level badge
		const levelBadge = metaContainer.createDiv({
			cls: `mp-help-level-badge level-${topic.level}`,
		});
		levelBadge.textContent = topic.level;

		// Tags
		if (topic.tags.length > 0) {
			const tagsContainer = metaContainer.createDiv({ cls: 'mp-help-topic-tags' });
			topic.tags.forEach((tag) => {
				tagsContainer.createSpan({ text: tag, cls: 'mp-help-tag' });
			});
		}

		// Keyboard shortcut
		if (topic.keyboardShortcut) {
			const kbdContainer = metaContainer.createDiv({ cls: 'mp-help-topic-kbd' });
			kbdContainer.createEl('span', { text: 'Shortcut: ' });
			kbdContainer.createEl('kbd', { text: topic.keyboardShortcut });
		}

		// Topic content (render Markdown)
		const contentBody = this.contentContainer.createDiv({ cls: 'mp-help-topic-body' });
		await MarkdownRenderer.renderMarkdown(topic.content, contentBody, '', this.plugin);

		// Related topics
		const relatedTopics = getRelatedTopics(topic.id);
		if (relatedTopics.length > 0) {
			const relatedSection = this.contentContainer.createDiv({ cls: 'mp-help-related' });
			relatedSection.createEl('h3', { text: 'Related Topics' });

			const relatedGrid = relatedSection.createDiv({ cls: 'mp-help-related-grid' });

			relatedTopics.forEach((relatedTopic) => {
				const relatedCard = relatedGrid.createDiv({ cls: 'mp-help-related-card' });

				const categoryInfo = HELP_CATEGORIES.find((c) => c.id === relatedTopic.category);
				if (categoryInfo) {
					const icon = relatedCard.createSpan({ cls: 'mp-help-related-icon' });
					icon.textContent = categoryInfo.icon;
				}

				relatedCard.createSpan({ text: relatedTopic.title, cls: 'mp-help-related-title' });

				relatedCard.addEventListener('click', () => {
					this.showTopic(relatedTopic);
					this.contentContainer.scrollTop = 0;
				});
			});
		}
	}

	private isInputFocused(): boolean {
		const activeEl = document.activeElement;
		return (
			activeEl instanceof HTMLInputElement ||
			activeEl instanceof HTMLTextAreaElement ||
			(activeEl instanceof HTMLElement && activeEl.isContentEditable)
		);
	}

	private addStyles(): void {
		if (document.getElementById('mp-help-panel-styles')) return;

		const style = document.createElement('style');
		style.id = 'mp-help-panel-styles';
		style.textContent = `
			.mp-help-panel {
				height: 100%;
				display: flex;
				flex-direction: column;
				overflow: hidden;
			}

			.mp-help-header {
				padding: 1rem;
				border-bottom: 1px solid var(--background-modifier-border);
				background: var(--background-primary);
			}

			.mp-help-title {
				display: flex;
				align-items: center;
				gap: 0.5rem;
				margin-bottom: 1rem;
			}

			.mp-help-title h2 {
				margin: 0;
				font-size: 1.25rem;
			}

			.mp-help-icon {
				color: var(--text-accent);
			}

			.mp-help-search {
				width: 100%;
			}

			.mp-help-search-input {
				width: 100%;
				padding: 0.5rem 0.75rem;
				border: 1px solid var(--background-modifier-border);
				border-radius: 6px;
				background: var(--background-primary);
				color: var(--text-normal);
				font-size: 0.9rem;
			}

			.mp-help-search-input:focus {
				outline: none;
				border-color: var(--interactive-accent);
			}

			.mp-help-main {
				display: flex;
				flex: 1;
				overflow: hidden;
			}

			.mp-help-sidebar {
				width: 200px;
				border-right: 1px solid var(--background-modifier-border);
				overflow-y: auto;
				background: var(--background-secondary);
			}

			.mp-help-categories {
				padding: 0.5rem;
			}

			.mp-help-category-button {
				display: flex;
				align-items: center;
				gap: 0.5rem;
				padding: 0.5rem 0.75rem;
				margin-bottom: 0.25rem;
				border-radius: 6px;
				cursor: pointer;
				transition: background-color 0.15s;
			}

			.mp-help-category-button:hover {
				background: var(--background-modifier-hover);
			}

			.mp-help-category-button.is-active {
				background: var(--interactive-accent);
				color: var(--text-on-accent);
			}

			.mp-help-category-icon {
				font-size: 1.1rem;
			}

			.mp-help-category-name {
				flex: 1;
				font-size: 0.9rem;
				font-weight: 500;
			}

			.mp-help-category-count {
				font-size: 0.75rem;
				opacity: 0.7;
				background: var(--background-primary-alt);
				padding: 0.1rem 0.4rem;
				border-radius: 10px;
			}

			.mp-help-category-button.is-active .mp-help-category-count {
				background: rgba(255, 255, 255, 0.2);
			}

			.mp-help-content-area {
				flex: 1;
				overflow: hidden;
				position: relative;
			}

			.mp-help-topic-list {
				height: 100%;
				overflow-y: auto;
				padding: 1rem;
			}

			.mp-help-topic-content {
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background: var(--background-primary);
				overflow-y: auto;
				padding: 1rem;
				transform: translateX(100%);
				transition: transform 0.3s;
			}

			.mp-help-topic-content.is-visible {
				transform: translateX(0);
			}

			.mp-help-list-header {
				margin-bottom: 1rem;
			}

			.mp-help-list-count {
				font-size: 0.9rem;
				color: var(--text-muted);
				font-weight: 500;
			}

			.mp-help-empty-state {
				text-align: center;
				padding: 3rem 1rem;
				color: var(--text-muted);
			}

			.mp-help-empty-state p {
				margin: 0.5rem 0;
			}

			.mp-help-empty-hint {
				font-size: 0.9rem;
			}

			.mp-help-topic-grid {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
				gap: 1rem;
			}

			.mp-help-topic-card {
				padding: 1rem;
				background: var(--background-primary-alt);
				border: 1px solid var(--background-modifier-border);
				border-radius: 8px;
				cursor: pointer;
				transition: all 0.15s;
			}

			.mp-help-topic-card:hover {
				border-color: var(--interactive-accent);
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
				transform: translateY(-2px);
			}

			.mp-help-topic-card-header {
				display: flex;
				align-items: center;
				gap: 0.5rem;
				margin-bottom: 0.75rem;
			}

			.mp-help-topic-category-icon {
				font-size: 1.2rem;
			}

			.mp-help-topic-card-title {
				margin: 0;
				font-size: 1rem;
				font-weight: 600;
				flex: 1;
			}

			.mp-help-level-badge {
				display: inline-block;
				padding: 0.2rem 0.5rem;
				border-radius: 4px;
				font-size: 0.7rem;
				font-weight: 600;
				text-transform: uppercase;
				margin-bottom: 0.5rem;
			}

			.mp-help-level-badge.level-beginner {
				background: var(--color-green);
				color: white;
			}

			.mp-help-level-badge.level-intermediate {
				background: var(--color-yellow);
				color: black;
			}

			.mp-help-level-badge.level-advanced {
				background: var(--color-red);
				color: white;
			}

			.mp-help-topic-tags {
				display: flex;
				flex-wrap: wrap;
				gap: 0.25rem;
				margin-bottom: 0.5rem;
			}

			.mp-help-tag {
				padding: 0.15rem 0.4rem;
				background: var(--background-secondary);
				border-radius: 3px;
				font-size: 0.75rem;
				color: var(--text-muted);
			}

			.mp-help-topic-kbd {
				font-size: 0.8rem;
				color: var(--text-muted);
			}

			.mp-help-topic-kbd kbd {
				padding: 0.1rem 0.4rem;
				background: var(--background-secondary-alt);
				border: 1px solid var(--background-modifier-border);
				border-radius: 3px;
				font-family: var(--font-monospace);
				font-size: 0.75rem;
			}

			.mp-help-breadcrumb {
				display: flex;
				align-items: center;
				gap: 0.75rem;
				margin-bottom: 1rem;
				padding-bottom: 0.75rem;
				border-bottom: 1px solid var(--background-modifier-border);
			}

			.mp-help-back-button {
				display: flex;
				align-items: center;
				gap: 0.25rem;
				padding: 0.4rem 0.75rem;
				background: var(--background-secondary);
				border: 1px solid var(--background-modifier-border);
				border-radius: 6px;
				cursor: pointer;
				font-size: 0.85rem;
				color: var(--text-normal);
				transition: background-color 0.15s;
			}

			.mp-help-back-button:hover {
				background: var(--background-modifier-hover);
			}

			.mp-help-category-badge {
				padding: 0.3rem 0.6rem;
				background: var(--background-secondary);
				border-radius: 4px;
				font-size: 0.85rem;
				font-weight: 500;
			}

			.mp-help-topic-header {
				margin-bottom: 1.5rem;
			}

			.mp-help-topic-header h1 {
				margin: 0 0 0.75rem 0;
				font-size: 1.75rem;
			}

			.mp-help-topic-meta {
				display: flex;
				align-items: center;
				gap: 0.75rem;
				flex-wrap: wrap;
			}

			.mp-help-topic-body {
				margin-bottom: 2rem;
				line-height: 1.6;
			}

			.mp-help-topic-body h1,
			.mp-help-topic-body h2,
			.mp-help-topic-body h3 {
				margin-top: 1.5rem;
				margin-bottom: 0.75rem;
			}

			.mp-help-topic-body ul,
			.mp-help-topic-body ol {
				margin-left: 1.5rem;
			}

			.mp-help-topic-body code {
				padding: 0.15rem 0.4rem;
				background: var(--background-secondary);
				border-radius: 3px;
				font-family: var(--font-monospace);
				font-size: 0.9em;
			}

			.mp-help-topic-body pre {
				padding: 1rem;
				background: var(--background-secondary);
				border-radius: 6px;
				overflow-x: auto;
			}

			.mp-help-related {
				margin-top: 2rem;
				padding-top: 2rem;
				border-top: 1px solid var(--background-modifier-border);
			}

			.mp-help-related h3 {
				margin: 0 0 1rem 0;
				font-size: 1.1rem;
			}

			.mp-help-related-grid {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
				gap: 0.75rem;
			}

			.mp-help-related-card {
				display: flex;
				align-items: center;
				gap: 0.5rem;
				padding: 0.75rem;
				background: var(--background-secondary);
				border: 1px solid var(--background-modifier-border);
				border-radius: 6px;
				cursor: pointer;
				transition: all 0.15s;
			}

			.mp-help-related-card:hover {
				border-color: var(--interactive-accent);
				transform: translateX(4px);
			}

			.mp-help-related-icon {
				font-size: 1.1rem;
			}

			.mp-help-related-title {
				font-size: 0.9rem;
				font-weight: 500;
			}

			@media (max-width: 768px) {
				.mp-help-sidebar {
					width: 150px;
				}

				.mp-help-topic-grid {
					grid-template-columns: 1fr;
				}

				.mp-help-related-grid {
					grid-template-columns: 1fr;
				}
			}
		`;
		document.head.appendChild(style);
	}

	async onClose() {
		// Cleanup
	}
}
