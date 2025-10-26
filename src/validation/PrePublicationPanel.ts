/**
 * Pre-publication Checklist Panel
 * Displays validation results with filtering and navigation
 */

import { ItemView, WorkspaceLeaf, TFile, Notice, MarkdownView } from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import { ValidationEngine } from './ValidationEngine';
import type {
	ValidationResults,
	ValidationIssue,
	ValidationSeverity,
	ValidationCategory,
} from './ValidationInterfaces';

export const VALIDATION_PANEL_VIEW_TYPE = 'validation-panel';

export class PrePublicationPanel extends ItemView {
	private validationEngine: ValidationEngine;
	private currentResults: ValidationResults | null = null;
	private filterSeverity: ValidationSeverity | 'all' = 'all';
	private filterCategory: ValidationCategory | 'all' = 'all';
	private isValidating = false;

	constructor(
		leaf: WorkspaceLeaf,
		private plugin: LatexPandocConcealerPlugin,
	) {
		super(leaf);
		this.validationEngine = new ValidationEngine(plugin);
	}

	getViewType(): string {
		return VALIDATION_PANEL_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Pre-publication Checklist';
	}

	getIcon(): string {
		return 'clipboard-check';
	}

	async onOpen(): Promise<void> {
		this.contentEl.empty();
		this.contentEl.addClass('validation-panel-view');

		this.render();
	}

	async onClose(): Promise<void> {
		// Cleanup
	}

	/**
	 * Main render method
	 */
	render(): void {
		this.contentEl.empty();

		// Render header
		this.renderHeader();

		// Render results or empty state
		if (this.currentResults) {
			this.renderResults();
		} else {
			this.renderEmptyState();
		}
	}

	/**
	 * Render header with run button
	 */
	private renderHeader(): void {
		const header = this.contentEl.createDiv({ cls: 'validation-panel-header' });

		const title = header.createEl('h2', { text: 'Pre-publication Checklist' });

		const runButton = header.createEl('button', {
			text: this.isValidating ? 'Validating...' : 'Run Validation',
			cls: 'mod-cta validation-run-button',
		});

		runButton.disabled = this.isValidating;

		runButton.addEventListener('click', async () => {
			await this.runValidation();
		});
	}

	/**
	 * Render empty state
	 */
	private renderEmptyState(): void {
		const emptyContainer = this.contentEl.createDiv({ cls: 'validation-empty-state' });

		emptyContainer.createEl('h3', { text: 'Ready to Validate' });

		const description = emptyContainer.createEl('p', {
			text: 'Click "Run Validation" to check your manuscript for common issues:',
		});

		const checklistEl = emptyContainer.createEl('ul', { cls: 'validation-checklist' });

		const checks = [
			'✓ Undefined cross-references',
			'✓ Duplicate labels',
			'✓ Missing bibliography entries',
			'✓ Figures without captions or labels',
			'✓ Tables without captions or labels',
			'✓ Empty sections',
			'✓ Inconsistent heading levels',
		];

		checks.forEach((check) => {
			checklistEl.createEl('li', { text: check });
		});

		const note = emptyContainer.createEl('p', {
			text: 'Validation scans all markdown files in your vault.',
			cls: 'validation-note',
		});
	}

	/**
	 * Render validation results
	 */
	private renderResults(): void {
		if (!this.currentResults) return;

		// Render summary
		this.renderSummary();

		// Render filters
		this.renderFilters();

		// Render issue list
		this.renderIssueList();
	}

	/**
	 * Render summary statistics
	 */
	private renderSummary(): void {
		if (!this.currentResults) return;

		const summary = this.contentEl.createDiv({ cls: 'validation-summary' });

		const { total, bySeverity } = this.currentResults.summary;

		// Overall status
		const statusEl = summary.createDiv({ cls: 'validation-status' });

		if (total === 0) {
			statusEl.innerHTML = '✅ <strong>All checks passed!</strong> Your manuscript is ready for publication.';
			statusEl.addClass('validation-status-success');
		} else if (bySeverity.critical > 0 || bySeverity.error > 0) {
			statusEl.innerHTML = `⚠️ <strong>Found ${bySeverity.critical + bySeverity.error} critical issues</strong> that should be fixed before publication.`;
			statusEl.addClass('validation-status-error');
		} else {
			statusEl.innerHTML = `ℹ️ <strong>Found ${total} suggestions</strong> to improve your manuscript.`;
			statusEl.addClass('validation-status-warning');
		}

		// Counts by severity
		const countsEl = summary.createDiv({ cls: 'validation-counts' });

		if (bySeverity.critical > 0) {
			const criticalEl = countsEl.createDiv({ cls: 'validation-count validation-count-critical' });
			criticalEl.innerHTML = `<span class="count">${bySeverity.critical}</span> Critical`;
		}

		if (bySeverity.error > 0) {
			const errorEl = countsEl.createDiv({ cls: 'validation-count validation-count-error' });
			errorEl.innerHTML = `<span class="count">${bySeverity.error}</span> Errors`;
		}

		if (bySeverity.warning > 0) {
			const warningEl = countsEl.createDiv({ cls: 'validation-count validation-count-warning' });
			warningEl.innerHTML = `<span class="count">${bySeverity.warning}</span> Warnings`;
		}

		if (bySeverity.info > 0) {
			const infoEl = countsEl.createDiv({ cls: 'validation-count validation-count-info' });
			infoEl.innerHTML = `<span class="count">${bySeverity.info}</span> Info`;
		}

		// Metadata
		const metaEl = summary.createDiv({ cls: 'validation-meta' });
		const timestamp = new Date(this.currentResults.timestamp).toLocaleString();
		metaEl.textContent = `Scanned ${this.currentResults.filesScanned} files · ${timestamp}`;
	}

	/**
	 * Render filter controls
	 */
	private renderFilters(): void {
		const filtersContainer = this.contentEl.createDiv({ cls: 'validation-filters' });

		// Severity filter
		const severityLabel = filtersContainer.createEl('label', { text: 'Severity: ' });
		const severitySelect = filtersContainer.createEl('select', { cls: 'validation-filter-select' });

		const severityOptions: Array<{ value: ValidationSeverity | 'all'; label: string }> = [
			{ value: 'all', label: 'All' },
			{ value: 'critical', label: 'Critical' },
			{ value: 'error', label: 'Errors' },
			{ value: 'warning', label: 'Warnings' },
			{ value: 'info', label: 'Info' },
		];

		severityOptions.forEach((opt) => {
			const option = severitySelect.createEl('option', { text: opt.label, value: opt.value });
			if (opt.value === this.filterSeverity) {
				option.selected = true;
			}
		});

		severitySelect.addEventListener('change', (e) => {
			this.filterSeverity = (e.target as HTMLSelectElement).value as ValidationSeverity | 'all';
			this.renderIssueList();
		});

		// Category filter
		const categoryLabel = filtersContainer.createEl('label', { text: 'Category: ', cls: 'filter-label-spacing' });
		const categorySelect = filtersContainer.createEl('select', { cls: 'validation-filter-select' });

		const categoryOptions: Array<{ value: ValidationCategory | 'all'; label: string }> = [
			{ value: 'all', label: 'All' },
			{ value: 'reference', label: 'References' },
			{ value: 'citation', label: 'Citations' },
			{ value: 'figure', label: 'Figures' },
			{ value: 'table', label: 'Tables' },
			{ value: 'equation', label: 'Equations' },
			{ value: 'structure', label: 'Structure' },
			{ value: 'format', label: 'Format' },
			{ value: 'consistency', label: 'Consistency' },
		];

		categoryOptions.forEach((opt) => {
			const option = categorySelect.createEl('option', { text: opt.label, value: opt.value });
			if (opt.value === this.filterCategory) {
				option.selected = true;
			}
		});

		categorySelect.addEventListener('change', (e) => {
			this.filterCategory = (e.target as HTMLSelectElement).value as ValidationCategory | 'all';
			this.renderIssueList();
		});
	}

	/**
	 * Render list of issues
	 */
	private renderIssueList(): void {
		if (!this.currentResults) return;

		// Remove existing issue list
		const existingList = this.contentEl.querySelector('.validation-issue-list');
		if (existingList) {
			existingList.remove();
		}

		const issueListContainer = this.contentEl.createDiv({ cls: 'validation-issue-list' });

		// Filter issues
		let filteredIssues = this.currentResults.issues;

		if (this.filterSeverity !== 'all') {
			filteredIssues = filteredIssues.filter((issue) => issue.severity === this.filterSeverity);
		}

		if (this.filterCategory !== 'all') {
			filteredIssues = filteredIssues.filter((issue) => issue.category === this.filterCategory);
		}

		// Group by category if enabled
		if (this.plugin.settings.validation?.groupByCategory !== false) {
			this.renderGroupedIssues(issueListContainer, filteredIssues);
		} else {
			this.renderFlatIssues(issueListContainer, filteredIssues);
		}

		// Show count
		if (filteredIssues.length === 0) {
			const emptyEl = issueListContainer.createDiv({ cls: 'validation-no-issues' });
			emptyEl.textContent = 'No issues match the current filters';
		}
	}

	/**
	 * Render issues grouped by category
	 */
	private renderGroupedIssues(container: HTMLElement, issues: ValidationIssue[]): void {
		const categories: ValidationCategory[] = [
			'reference',
			'citation',
			'figure',
			'table',
			'equation',
			'structure',
			'format',
			'consistency',
		];

		const categoryLabels: Record<ValidationCategory, string> = {
			reference: 'Cross-References',
			citation: 'Citations & Bibliography',
			figure: 'Figures',
			table: 'Tables',
			equation: 'Equations',
			structure: 'Document Structure',
			format: 'Formatting',
			consistency: 'Consistency',
		};

		for (const category of categories) {
			const categoryIssues = issues.filter((issue) => issue.category === category);

			if (categoryIssues.length === 0) continue;

			const groupEl = container.createDiv({ cls: 'validation-issue-group' });

			const headerEl = groupEl.createEl('h3', { cls: 'validation-group-header' });
			headerEl.textContent = `${categoryLabels[category]} (${categoryIssues.length})`;

			const issuesEl = groupEl.createDiv({ cls: 'validation-group-issues' });

			categoryIssues.forEach((issue) => {
				this.renderIssue(issuesEl, issue);
			});
		}
	}

	/**
	 * Render issues in flat list
	 */
	private renderFlatIssues(container: HTMLElement, issues: ValidationIssue[]): void {
		issues.forEach((issue) => {
			this.renderIssue(container, issue);
		});
	}

	/**
	 * Render a single issue
	 */
	private renderIssue(container: HTMLElement, issue: ValidationIssue): void {
		const issueEl = container.createDiv({ cls: `validation-issue validation-issue-${issue.severity}` });

		// Severity badge
		const badgeEl = issueEl.createDiv({ cls: `validation-badge validation-badge-${issue.severity}` });
		badgeEl.textContent = issue.severity.toUpperCase();

		// Content
		const contentEl = issueEl.createDiv({ cls: 'validation-issue-content' });

		// Message
		const messageEl = contentEl.createDiv({ cls: 'validation-issue-message' });
		messageEl.textContent = issue.message;

		// Location
		if (issue.location.file && issue.location.file !== 'multiple') {
			const locationEl = contentEl.createDiv({ cls: 'validation-issue-location' });
			const locationText = issue.location.line ? `${issue.location.file}:${issue.location.line}` : issue.location.file;

			const locationLink = locationEl.createEl('a', { text: locationText, cls: 'validation-location-link' });

			locationLink.addEventListener('click', async (e) => {
				e.preventDefault();
				await this.navigateToIssue(issue);
			});
		}

		// Description (if present)
		if (issue.description) {
			const descEl = contentEl.createDiv({ cls: 'validation-issue-description' });
			descEl.textContent = issue.description;
		}

		// Suggestion (if present)
		if (issue.suggestion) {
			const suggestionEl = contentEl.createDiv({ cls: 'validation-issue-suggestion' });
			suggestionEl.innerHTML = `💡 <em>${issue.suggestion}</em>`;
		}
	}

	/**
	 * Navigate to the location of an issue
	 */
	private async navigateToIssue(issue: ValidationIssue): Promise<void> {
		if (!issue.location.file || issue.location.file === 'multiple') {
			new Notice('Cannot navigate to this issue (affects multiple files)');
			return;
		}

		const file = this.plugin.app.vault.getAbstractFileByPath(issue.location.file);

		if (!(file instanceof TFile)) {
			new Notice(`File not found: ${issue.location.file}`);
			return;
		}

		const leaf = this.plugin.app.workspace.getLeaf(false);
		await leaf.openFile(file);

		// Set cursor to line if available
		if (issue.location.line !== undefined) {
			const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
			if (view) {
				view.editor.setCursor({
					line: issue.location.line - 1, // 0-indexed
					ch: issue.location.ch || 0,
				});

				// Scroll into view
				view.editor.scrollIntoView(
					{
						from: { line: issue.location.line - 1, ch: 0 },
						to: { line: issue.location.line, ch: 0 },
					},
					true,
				);
			}
		}
	}

	/**
	 * Run validation on all files
	 */
	async runValidation(): Promise<void> {
		this.isValidating = true;
		this.render();

		try {
			new Notice('Running pre-publication validation...');

			this.currentResults = await this.validationEngine.validateManuscript();

			this.render();

			const { total, bySeverity } = this.currentResults.summary;

			if (total === 0) {
				new Notice('✓ All checks passed! Your manuscript is ready.');
			} else {
				const criticalCount = bySeverity.critical + bySeverity.error;
				if (criticalCount > 0) {
					new Notice(`⚠️ Found ${criticalCount} critical issues. See validation panel for details.`);
				} else {
					new Notice(`ℹ️ Found ${total} suggestions. See validation panel for details.`);
				}
			}
		} catch (error) {
			console.error('Validation failed:', error);
			new Notice('Validation failed. See console for details.');
		} finally {
			this.isValidating = false;
		}
	}

	/**
	 * Clear validation results
	 */
	clearResults(): void {
		this.currentResults = null;
		this.render();
	}
}
