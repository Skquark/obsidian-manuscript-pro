import { App, PluginSettingTab, Notice } from 'obsidian';
import ManuscriptProPlugin from '../main';
import { SettingsTab } from '../settingsTab';
import { SettingsTemplateModal } from './SettingsTemplateModal';

/**
 * Tab Configuration
 */
interface TabConfig {
	id: string;
	name: string;
	icon: string;
	sections: string[]; // H3 heading texts to include in this tab
}

/**
 * Tabbed Settings Wrapper
 * Wraps the existing settings and organizes them into tabs
 */
export class TabbedSettingsWrapper extends PluginSettingTab {
	plugin: ManuscriptProPlugin;
	private activeTab: string = 'general';
	private searchQuery: string = '';
	private originalSettings: SettingsTab;
	private tabs: TabConfig[] = [
		{
			id: 'general',
			name: 'General',
			icon: 'settings',
			sections: [
				'General',
				'Pattern Groups',
				'Profile Management',
				'Cursor Revealing',
				'User Interface',
				'Advanced',
				'Custom Patterns',
				'Reset',
			],
		},
		{
			id: 'writing',
			name: 'Writing',
			icon: 'pen-tool',
			sections: ['Focus Mode', 'Manuscript Statistics', 'Templates & Snippets'],
		},
		{
			id: 'citations',
			name: 'Citations',
			icon: 'quote',
			sections: ['Citation Preview', 'Enhanced Bibliography', 'Cross-Reference Intelligence'],
		},
		{
			id: 'manuscript',
			name: 'Manuscript',
			icon: 'book-open',
			sections: ['Manuscript Navigator', 'Pre-publication Validation'],
		},
		{
			id: 'export',
			name: 'Export',
			icon: 'download',
			sections: ['Export & Publishing'],
		},
	];

	constructor(app: App, plugin: ManuscriptProPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.originalSettings = new SettingsTab(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass('manuscript-pro-settings-tabbed');

		// Header with action buttons
		const headerContainer = containerEl.createDiv({ cls: 'mp-settings-header' });
		headerContainer.createEl('h2', { text: 'Manuscript Pro Settings' });

		const actionButtons = headerContainer.createDiv({ cls: 'mp-settings-actions' });

		// Templates button
		const templatesBtn = actionButtons.createEl('button', {
			text: 'Templates',
			cls: 'mp-action-button mp-action-primary',
		});
		templatesBtn.addEventListener('click', () => this.showTemplates());

		// Export button
		const exportBtn = actionButtons.createEl('button', {
			text: 'Export',
			cls: 'mp-action-button',
		});
		exportBtn.addEventListener('click', () => this.exportSettings());

		// Import button
		const importBtn = actionButtons.createEl('button', {
			text: 'Import',
			cls: 'mp-action-button',
		});
		importBtn.addEventListener('click', () => this.importSettings());

		// Search box
		const searchContainer = containerEl.createDiv({ cls: 'mp-settings-search-container' });
		const searchInput = searchContainer.createEl('input', {
			type: 'text',
			placeholder: 'Search settings...',
			cls: 'mp-settings-search-input',
			value: this.searchQuery,
		});

		searchInput.addEventListener('input', (e) => {
			this.searchQuery = (e.target as HTMLInputElement).value;
			this.display();
		});

		// Create tab navigation
		const tabNav = containerEl.createDiv({ cls: 'mp-tab-nav' });

		this.tabs.forEach((tab) => {
			const tabButton = tabNav.createDiv({
				cls: `mp-tab-button ${this.activeTab === tab.id ? 'is-active' : ''}`,
			});

			// Icon
			const icon = tabButton.createSpan({ cls: 'mp-tab-icon' });
			icon.innerHTML = this.getIconSVG(tab.icon);

			// Label
			tabButton.createSpan({ text: tab.name, cls: 'mp-tab-label' });

			// Click handler
			tabButton.addEventListener('click', () => {
				this.activeTab = tab.id;
				this.searchQuery = ''; // Clear search when switching tabs
				this.display();
			});
		});

		// Create content container
		const contentContainer = containerEl.createDiv({ cls: 'mp-tab-content' });

		// Render original settings into temporary container
		const tempContainer = document.createElement('div');
		(this.originalSettings as any).containerEl = tempContainer;
		this.originalSettings.display();

		// Filter sections based on search or active tab
		if (this.searchQuery.trim()) {
			this.filterBySearch(tempContainer, this.searchQuery, contentContainer);
		} else {
			const activeTabConfig = this.tabs.find((t) => t.id === this.activeTab);
			if (activeTabConfig) {
				this.filterSections(tempContainer, activeTabConfig.sections, contentContainer);
			}
		}

		// Add styles
		this.addStyles();
	}

	/**
	 * Filter and display only specified sections
	 */
	private filterSections(source: HTMLElement, sectionNames: string[], target: HTMLElement): void {
		// Get all H3 elements (section headers)
		const allH3s = Array.from(source.querySelectorAll('h3'));

		sectionNames.forEach((sectionName) => {
			// Find the H3 with this text
			const h3 = allH3s.find((el) => el.textContent === sectionName);
			if (!h3) return;

			// Clone the H3
			target.appendChild(h3.cloneNode(true));

			// Get all elements until next H3
			let current = h3.nextElementSibling;
			while (current && current.tagName !== 'H3') {
				target.appendChild(current.cloneNode(true));
				current = current.nextElementSibling;
			}
		});

		// Re-attach event listeners and restore functionality
		this.restoreInteractivity(target);
	}

	/**
	 * Filter sections by search query
	 */
	private filterBySearch(source: HTMLElement, query: string, target: HTMLElement): void {
		const searchLower = query.toLowerCase().trim();
		const allH3s = Array.from(source.querySelectorAll('h3'));
		let matchCount = 0;

		allH3s.forEach((h3) => {
			// Collect section content
			const sectionElements: Element[] = [h3];
			let current = h3.nextElementSibling;
			while (current && current.tagName !== 'H3') {
				sectionElements.push(current);
				current = current.nextElementSibling;
			}

			// Check if section matches search
			const sectionText = sectionElements
				.map((el) => el.textContent || '')
				.join(' ')
				.toLowerCase();

			if (sectionText.includes(searchLower)) {
				matchCount++;

				// Clone and append matching section
				sectionElements.forEach((el) => {
					const cloned = el.cloneNode(true) as HTMLElement;
					this.highlightSearchTerms(cloned, searchLower);
					target.appendChild(cloned);
				});
			}
		});

		// Show "no results" message if nothing matched
		if (matchCount === 0) {
			const noResults = target.createDiv({ cls: 'mp-no-search-results' });
			noResults.createEl('p', {
				text: `No settings found matching "${query}"`,
			});
			noResults.createEl('p', {
				text: 'Try different keywords or browse by category using the tabs above.',
				cls: 'mp-no-results-hint',
			});
		} else {
			// Show result count
			const resultCount = target.createDiv({ cls: 'mp-search-result-count' });
			resultCount.createEl('span', {
				text: `Found ${matchCount} section${matchCount !== 1 ? 's' : ''} matching "${query}"`,
			});

			// Re-attach event listeners
			this.restoreInteractivity(target);
		}
	}

	/**
	 * Highlight search terms in element
	 */
	private highlightSearchTerms(element: HTMLElement, searchTerm: string): void {
		const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
		const textNodes: Text[] = [];

		// Collect all text nodes
		let node;
		while ((node = walker.nextNode())) {
			textNodes.push(node as Text);
		}

		// Highlight matches in text nodes
		textNodes.forEach((textNode) => {
			const text = textNode.textContent || '';
			const lowerText = text.toLowerCase();
			const index = lowerText.indexOf(searchTerm);

			if (index !== -1 && textNode.parentElement) {
				const before = text.substring(0, index);
				const match = text.substring(index, index + searchTerm.length);
				const after = text.substring(index + searchTerm.length);

				const span = document.createElement('span');
				span.appendChild(document.createTextNode(before));

				const highlight = document.createElement('mark');
				highlight.className = 'mp-search-highlight';
				highlight.textContent = match;
				span.appendChild(highlight);

				span.appendChild(document.createTextNode(after));

				textNode.parentElement.replaceChild(span, textNode);
			}
		});
	}

	/**
	 * Restore button clicks and input handlers after cloning
	 */
	private restoreInteractivity(container: HTMLElement): void {
		// Get fresh reference to settings
		const settings = this.plugin.settings;

		// Restore toggle buttons
		container.querySelectorAll('.checkbox-container').forEach((checkbox) => {
			const input = checkbox.querySelector('input[type="checkbox"]') as HTMLInputElement;
			if (!input) return;

			// Re-attach event listener
			const originalHandler = input.onclick;
			input.onclick = null;
			input.addEventListener('change', async () => {
				if (originalHandler) {
					await (originalHandler as any).call(input);
				}
			});
		});

		// Restore button clicks
		container.querySelectorAll('button').forEach((button) => {
			const text = button.textContent;
			if (!text) return;

			// Re-attach specific handlers based on button text
			if (text.includes('Open')) {
				button.addEventListener('click', async () => {
					// Call the appropriate activation method based on context
					if (text.includes('Navigator')) {
						await this.plugin.activateManuscriptNavigator();
					} else if (text.includes('Browser')) {
						await this.plugin.activateLabelBrowser();
					} else if (text.includes('Panel') || text.includes('Stats')) {
						await this.plugin.activateStatsView();
					} else if (text.includes('Checklist')) {
						await this.plugin.activateValidationPanel();
					}
				});
			}

			// Restore profile actions
			if (text.includes('Export') && text.includes('PDF')) {
				button.addEventListener('click', async () => {
					await this.plugin.exportManager.exportCurrentFile('pdf-academic');
				});
			}
			if (text.includes('Export') && text.includes('DOCX')) {
				button.addEventListener('click', async () => {
					await this.plugin.exportManager.exportCurrentFile('docx-standard');
				});
			}
			if (text.includes('Export') && text.includes('HTML')) {
				button.addEventListener('click', async () => {
					await this.plugin.exportManager.exportCurrentFile('html-web');
				});
			}

			// Refresh buttons
			if (text.includes('Refresh') || text.includes('Reload')) {
				button.addEventListener('click', async () => {
					this.display();
				});
			}
		});
	}

	/**
	 * Get icon SVG
	 */
	private getIconSVG(iconName: string): string {
		const icons: Record<string, string> = {
			settings:
				'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6"></path></svg>',
			'pen-tool':
				'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 19 7-7 3 3-7 7-3-3z"></path><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path></svg>',
			quote:
				'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path></svg>',
			'book-open':
				'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>',
			download:
				'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
		};
		return icons[iconName] || icons.settings;
	}

	/**
	 * Show settings templates modal
	 */
	private showTemplates(): void {
		const modal = new SettingsTemplateModal(this.app, this.plugin, () => {
			this.display();
		});
		modal.open();
	}

	/**
	 * Export settings to JSON file
	 */
	private async exportSettings(): Promise<void> {
		try {
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
			const filename = `manuscript-pro-settings-${timestamp}.json`;

			// Create export object with metadata
			const exportData = {
				metadata: {
					exportedAt: new Date().toISOString(),
					pluginVersion: this.plugin.manifest.version,
					obsidianVersion: (this.app as any).appVersion || 'unknown',
				},
				settings: this.plugin.settings,
			};

			// Convert to formatted JSON
			const jsonContent = JSON.stringify(exportData, null, 2);

			// Create download link
			const blob = new Blob([jsonContent], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = filename;
			link.click();
			URL.revokeObjectURL(url);

			new Notice(`Settings exported to ${filename}`);
		} catch (error) {
			console.error('Failed to export settings:', error);
			new Notice('Failed to export settings');
		}
	}

	/**
	 * Import settings from JSON file
	 */
	private async importSettings(): Promise<void> {
		// Create file input
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';

		input.addEventListener('change', async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;

			try {
				const content = await file.text();
				const importData = JSON.parse(content);

				// Validate import structure
				if (!importData.settings) {
					new Notice('Invalid settings file: missing settings data');
					return;
				}

				// Show confirmation with version info
				const confirmMessage = importData.metadata
					? `Import settings exported on ${new Date(importData.metadata.exportedAt).toLocaleDateString()}?\n\nThis will replace your current settings.`
					: 'Import these settings? This will replace your current settings.';

				if (confirm(confirmMessage)) {
					// Apply settings
					this.plugin.settings = importData.settings;
					await this.plugin.saveSettings();

					new Notice('Settings imported successfully! Reloading settings...');

					// Refresh display
					this.display();
				}
			} catch (error) {
				console.error('Failed to import settings:', error);
				new Notice('Failed to import settings: Invalid JSON file');
			}
		});

		input.click();
	}

	/**
	 * Add tab styles
	 */
	private addStyles(): void {
		if (document.getElementById('mp-tab-styles')) return;

		const style = document.createElement('style');
		style.id = 'mp-tab-styles';
		style.textContent = `
			.manuscript-pro-settings-tabbed {
				max-width: 900px;
				margin: 0 auto;
			}

			/* Header with action buttons */
			.mp-settings-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 0.5rem;
			}

			.mp-settings-header h2 {
				margin: 0;
			}

			.mp-settings-actions {
				display: flex;
				gap: 0.5rem;
			}

			.mp-action-button {
				padding: 0.4rem 0.8rem;
				font-size: 0.85rem;
				border: 1px solid var(--background-modifier-border);
				border-radius: 4px;
				background: var(--interactive-normal);
				color: var(--text-normal);
				cursor: pointer;
				transition: all 0.15s ease;
				font-weight: 500;
			}

			.mp-action-button:hover {
				background: var(--interactive-hover);
				border-color: var(--interactive-accent);
			}

			.mp-action-button:active {
				background: var(--interactive-accent);
				color: var(--text-on-accent);
			}

			.mp-action-primary {
				background: var(--interactive-accent);
				color: var(--text-on-accent);
				border-color: var(--interactive-accent);
			}

			.mp-action-primary:hover {
				background: var(--interactive-accent-hover);
				border-color: var(--interactive-accent-hover);
			}

			/* Search box styling */
			.mp-settings-search-container {
				margin: 1.25rem 0 1rem 0;
				position: relative;
			}

			.mp-settings-search-input {
				width: 100%;
				padding: 0.6rem 0.9rem;
				border: 1px solid var(--background-modifier-border);
				border-radius: 6px;
				background: var(--background-primary);
				color: var(--text-normal);
				font-size: 0.9rem;
				transition: all 0.2s ease;
			}

			.mp-settings-search-input:focus {
				outline: none;
				border-color: var(--interactive-accent);
				box-shadow: 0 0 0 2px var(--interactive-accent-hover);
			}

			.mp-settings-search-input::placeholder {
				color: var(--text-muted);
			}

			/* Search result count */
			.mp-search-result-count {
				padding: 0.75rem 1rem;
				margin-bottom: 1rem;
				background: var(--background-secondary);
				border-left: 3px solid var(--interactive-accent);
				border-radius: 4px;
				font-size: 0.875rem;
				color: var(--text-muted);
			}

			/* Search highlight */
			.mp-search-highlight {
				background: var(--text-highlight-bg);
				color: var(--text-normal);
				padding: 0.1rem 0.2rem;
				border-radius: 2px;
				font-weight: 500;
			}

			/* No results message */
			.mp-no-search-results {
				text-align: center;
				padding: 3rem 2rem;
				color: var(--text-muted);
			}

			.mp-no-search-results p:first-child {
				font-size: 1.1rem;
				margin-bottom: 0.5rem;
				color: var(--text-normal);
			}

			.mp-no-results-hint {
				font-size: 0.9rem;
			}

			/* Tab navigation container with horizontal scroll */
			.mp-tab-nav {
				display: flex;
				gap: 0.25rem;
				margin: 1.5rem 0 1.5rem 0;
				padding: 0.25rem 0.5rem 0 0.5rem;
				border-bottom: 1px solid var(--background-modifier-border);
				overflow-x: auto;
				overflow-y: hidden;
				scroll-behavior: smooth;
				-webkit-overflow-scrolling: touch;
				scrollbar-width: thin;
				scrollbar-color: var(--background-modifier-border) transparent;
			}

			/* Hide scrollbar on webkit browsers but keep functionality */
			.mp-tab-nav::-webkit-scrollbar {
				height: 4px;
			}

			.mp-tab-nav::-webkit-scrollbar-track {
				background: transparent;
			}

			.mp-tab-nav::-webkit-scrollbar-thumb {
				background: var(--background-modifier-border);
				border-radius: 2px;
			}

			.mp-tab-nav::-webkit-scrollbar-thumb:hover {
				background: var(--text-muted);
			}

			/* Tab button - more compact and modern */
			.mp-tab-button {
				display: flex;
				align-items: center;
				gap: 0.4rem;
				padding: 0.5rem 0.85rem;
				cursor: pointer;
				border-radius: 4px 4px 0 0;
				background: transparent;
				color: var(--text-muted);
				font-weight: 500;
				font-size: 0.875rem;
				transition: all 0.15s ease;
				position: relative;
				bottom: -1px;
				user-select: none;
				white-space: nowrap;
				flex-shrink: 0;
				border: 1px solid transparent;
			}

			.mp-tab-button:hover {
				background: var(--background-modifier-hover);
				color: var(--text-normal);
			}

			.mp-tab-button.is-active {
				background: var(--background-primary-alt);
				color: var(--interactive-accent);
				border: 1px solid var(--background-modifier-border);
				border-bottom-color: var(--background-primary-alt);
				box-shadow: 0 -2px 0 0 var(--interactive-accent) inset;
				font-weight: 600;
			}

			.mp-tab-icon {
				display: flex;
				align-items: center;
				justify-content: center;
				width: 14px;
				height: 14px;
				opacity: 0.8;
			}

			.mp-tab-button.is-active .mp-tab-icon {
				opacity: 1;
			}

			.mp-tab-icon svg {
				width: 14px;
				height: 14px;
			}

			.mp-tab-label {
				font-size: 0.875rem;
				white-space: nowrap;
			}

			/* Tab content area */
			.mp-tab-content {
				padding: 1.5rem 0;
				min-height: 400px;
			}

			.mp-tab-content > h3:first-child {
				margin-top: 0;
			}

			.mp-tab-content h3 {
				margin-top: 2rem;
				margin-bottom: 1rem;
				padding-bottom: 0.5rem;
				border-bottom: 1px solid var(--background-modifier-border);
				font-size: 1.05rem;
				font-weight: 600;
				color: var(--text-normal);
			}

			.mp-tab-content h4.setting-item-heading {
				font-weight: 600;
				color: var(--text-normal);
				margin-top: 1.5rem;
				margin-bottom: 0.75rem;
				font-size: 0.95rem;
			}

			/* Responsive - mobile/tablet */
			@media (max-width: 768px) {
				.mp-tab-nav {
					gap: 0.2rem;
					padding: 0.25rem 0.25rem 0 0.25rem;
				}

				.mp-tab-button {
					padding: 0.45rem 0.65rem;
					font-size: 0.8rem;
					gap: 0.3rem;
				}

				.mp-tab-icon {
					width: 12px;
					height: 12px;
				}

				.mp-tab-icon svg {
					width: 12px;
					height: 12px;
				}

				.mp-tab-label {
					font-size: 0.8rem;
				}
			}
		`;
		document.head.appendChild(style);
	}
}
