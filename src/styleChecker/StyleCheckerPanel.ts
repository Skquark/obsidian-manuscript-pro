import { ItemView, WorkspaceLeaf, Menu, setIcon, Notice, TFile, MarkdownView } from 'obsidian';
import ManuscriptProPlugin from '../main';
import { StyleChecker } from './StyleChecker';
import { StyleIssue, StyleCheckResult, ReadabilityMetrics, TenseAnalysis, POVAnalysis, IssueSeverity, RuleCategory, StyleRule } from './StyleCheckerInterfaces';
import { getAllBuiltInRules } from './BuiltInRules';
import { CustomRulesManagerModal } from './CustomRuleModal';
import { StyleReportGenerator } from './StyleReportGenerator';

export const STYLE_CHECKER_VIEW_TYPE = 'manuscript-pro-style-checker';

/**
 * Style Checker Panel
 * Displays style issues found in the active document
 */
export class StyleCheckerPanel extends ItemView {
	private plugin: ManuscriptProPlugin;
	private checker: StyleChecker;
	private reportGenerator: StyleReportGenerator;
	private currentResult: StyleCheckResult | null = null;
	private currentFile: TFile | null = null;
	private filterSeverity: IssueSeverity | 'all' = 'all';
	private filterCategory: RuleCategory | 'all' = 'all';
	private sortBy: 'severity' | 'line' | 'category' = 'line';

	constructor(leaf: WorkspaceLeaf, plugin: ManuscriptProPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.checker = new StyleChecker(this.app);
		this.reportGenerator = new StyleReportGenerator(this.app, this.checker);

		// Load all rules (built-in + custom)
		this.loadRules();

		// Exclude code blocks by default
		this.checker.setExcludePatterns([
			'```[\\s\\S]*?```',  // Code blocks
			'`[^`]+`',           // Inline code
			'\\$\\$[\\s\\S]*?\\$\\$'  // Display math
		]);
	}

	getViewType(): string {
		return STYLE_CHECKER_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Style Checker';
	}

	getIcon(): string {
		return 'check-circle';
	}

	async onOpen(): Promise<void> {
		this.render();

		// Auto-check active file on open
		this.checkActiveFile();

		// Listen for file changes
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				this.checkActiveFile();
			})
		);
	}

	async onClose(): Promise<void> {
		// Cleanup
	}

	/**
	 * Refresh the view
	 */
	refresh(): void {
		this.render();
	}

	/**
	 * Check the currently active file
	 */
	async checkActiveFile(): Promise<void> {
		const activeFile = this.app.workspace.getActiveFile();

		if (!activeFile) {
			this.currentFile = null;
			this.currentResult = null;
			this.render();
			return;
		}

		// Only check markdown files
		if (activeFile.extension !== 'md') {
			this.currentFile = null;
			this.currentResult = null;
			this.render();
			return;
		}

		this.currentFile = activeFile;

		try {
			this.currentResult = await this.checker.checkFile(activeFile);
			this.render();
		} catch (error) {
			console.error('Style check failed:', error);
			new Notice('Style check failed');
		}
	}

	/**
	 * Render the panel
	 */
	private render(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('manuscript-pro-style-checker-panel');

		// Header
		this.renderHeader();

		if (!this.currentResult) {
			this.renderEmptyState();
			return;
		}

		// Summary
		this.renderSummary();

		// Filters
		this.renderFilters();

		// Issues list
		this.renderIssuesList();
	}

	/**
	 * Render header
	 */
	private renderHeader(): void {
		const header = this.contentEl.createDiv('style-checker-header');

		const title = header.createEl('h3', { text: 'Style Checker', cls: 'style-checker-title' });

		const actions = header.createDiv('style-checker-actions');

		// Check button
		const checkBtn = actions.createEl('button', { cls: 'style-checker-action-btn' });
		setIcon(checkBtn, 'refresh-cw');
		checkBtn.title = 'Re-check current file';
		checkBtn.addEventListener('click', () => this.checkActiveFile());

		// Settings button
		const settingsBtn = actions.createEl('button', { cls: 'style-checker-action-btn' });
		setIcon(settingsBtn, 'settings');
		settingsBtn.title = 'Style checker settings';
		settingsBtn.addEventListener('click', (e) => this.showSettingsMenu(e));
	}

	/**
	 * Render empty state
	 */
	private renderEmptyState(): void {
		const empty = this.contentEl.createDiv('style-checker-empty-state');

		if (!this.currentFile) {
			empty.createEl('p', { text: 'Open a markdown file to check its style' });
		} else {
			empty.createEl('p', { text: 'Click the refresh button to check this file' });
		}
	}

	/**
	 * Render summary statistics
	 */
	private renderSummary(): void {
		if (!this.currentResult) return;

		const summary = this.contentEl.createDiv('style-checker-summary');

		// File name
		const fileName = summary.createDiv('style-checker-filename');
		fileName.createEl('strong', { text: this.currentFile?.name || 'Unknown file' });

		// Issue counts
		const counts = summary.createDiv('style-checker-counts');

		this.createCountBadge(counts, 'error', this.currentResult.errors.length, 'Errors');
		this.createCountBadge(counts, 'warning', this.currentResult.warnings.length, 'Warnings');
		this.createCountBadge(counts, 'info', this.currentResult.info.length, 'Info');
		this.createCountBadge(counts, 'suggestion', this.currentResult.suggestions.length, 'Suggestions');

		// Document stats
		const stats = summary.createDiv('style-checker-stats');
		stats.createSpan({ text: `${this.currentResult.wordCount} words`, cls: 'style-stat-item' });
		stats.createSpan({ text: `${this.currentResult.sentenceCount} sentences`, cls: 'style-stat-item' });
		stats.createSpan({ text: `${Math.round(this.currentResult.avgWordsPerSentence)} avg words/sentence`, cls: 'style-stat-item' });
	}

	/**
	 * Create count badge
	 */
	private createCountBadge(container: HTMLElement, severity: string, count: number, label: string): void {
		const badge = container.createDiv(`style-count-badge severity-${severity}`);
		badge.createSpan({ text: count.toString(), cls: 'count' });
		badge.createSpan({ text: label, cls: 'label' });
	}

	/**
	 * Render filters
	 */
	private renderFilters(): void {
		const filters = this.contentEl.createDiv('style-checker-filters');

		// Severity filter
		const severityFilter = filters.createDiv('filter-group');
		severityFilter.createSpan({ text: 'Severity:', cls: 'filter-label' });

		const severities: Array<IssueSeverity | 'all'> = ['all', 'error', 'warning', 'info', 'suggestion'];
		severities.forEach(sev => {
			const btn = severityFilter.createEl('button', {
				text: sev,
				cls: `filter-btn ${this.filterSeverity === sev ? 'active' : ''}`
			});
			btn.addEventListener('click', () => {
				this.filterSeverity = sev;
				this.render();
			});
		});

		// Category filter
		const categoryFilter = filters.createDiv('filter-group');
		categoryFilter.createSpan({ text: 'Category:', cls: 'filter-label' });

		const categories: Array<RuleCategory | 'all'> = ['all', 'punctuation', 'formatting', 'tense', 'pov', 'dialogue', 'repetition', 'readability', 'academic', 'latex'];
		categories.forEach(cat => {
			const btn = categoryFilter.createEl('button', {
				text: cat,
				cls: `filter-btn ${this.filterCategory === cat ? 'active' : ''}`
			});
			btn.addEventListener('click', () => {
				this.filterCategory = cat;
				this.render();
			});
		});

		// Sort
		const sortFilter = filters.createDiv('filter-group');
		sortFilter.createSpan({ text: 'Sort:', cls: 'filter-label' });

		const sorts: Array<'severity' | 'line' | 'category'> = ['severity', 'line', 'category'];
		sorts.forEach(sort => {
			const btn = sortFilter.createEl('button', {
				text: sort,
				cls: `filter-btn ${this.sortBy === sort ? 'active' : ''}`
			});
			btn.addEventListener('click', () => {
				this.sortBy = sort;
				this.render();
			});
		});
	}

	/**
	 * Render issues list
	 */
	private renderIssuesList(): void {
		if (!this.currentResult) return;

		const listContainer = this.contentEl.createDiv('style-checker-issues-list');

		// Get all issues
		let allIssues = [
			...this.currentResult.errors,
			...this.currentResult.warnings,
			...this.currentResult.info,
			...this.currentResult.suggestions
		];

		// Apply filters
		if (this.filterSeverity !== 'all') {
			allIssues = allIssues.filter(i => i.severity === this.filterSeverity);
		}

		if (this.filterCategory !== 'all') {
			allIssues = allIssues.filter(i => i.category === this.filterCategory);
		}

		// Sort
		switch (this.sortBy) {
			case 'severity':
				const severityOrder = { error: 0, warning: 1, info: 2, suggestion: 3 };
				allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
				break;
			case 'line':
				allIssues.sort((a, b) => a.line - b.line);
				break;
			case 'category':
				allIssues.sort((a, b) => a.category.localeCompare(b.category));
				break;
		}

		// Render issues
		if (allIssues.length === 0) {
			listContainer.createDiv('style-checker-no-issues')
				.createEl('p', { text: '✓ No issues found with current filters' });
			return;
		}

		allIssues.forEach(issue => {
			this.renderIssue(listContainer, issue);
		});
	}

	/**
	 * Render a single issue
	 */
	private renderIssue(container: HTMLElement, issue: StyleIssue): void {
		const issueEl = container.createDiv('style-issue');
		issueEl.addClass(`severity-${issue.severity}`);
		issueEl.setAttribute('data-line', issue.line.toString());

		// Header
		const header = issueEl.createDiv('issue-header');

		// Severity icon
		const severityIcon = header.createSpan({ cls: 'issue-severity-icon' });
		setIcon(severityIcon, this.getSeverityIcon(issue.severity));

		// Title
		const title = header.createDiv('issue-title');
		title.createSpan({ text: issue.ruleName, cls: 'issue-rule-name' });
		title.createSpan({ text: ` (Line ${issue.line})`, cls: 'issue-location' });

		// Category badge
		const categoryBadge = header.createDiv('issue-category-badge');
		categoryBadge.textContent = issue.category;

		// Message
		const message = issueEl.createDiv('issue-message');
		message.textContent = issue.message;

		// Context
		if (issue.context) {
			const context = issueEl.createDiv('issue-context');

			// Highlight matched text in context
			const highlightedContext = issue.context.replace(
				issue.matchedText,
				`<mark>${issue.matchedText}</mark>`
			);
			context.innerHTML = highlightedContext;
		}

		// Suggestion
		if (issue.suggestion) {
			const suggestion = issueEl.createDiv('issue-suggestion');
			suggestion.createEl('strong', { text: 'Suggestion: ' });
			suggestion.createSpan({ text: issue.suggestion });
		}

		// Actions
		const actions = issueEl.createDiv('issue-actions');

		// Jump to location
		const jumpBtn = actions.createEl('button', { text: 'Jump to location', cls: 'issue-action-btn' });
		jumpBtn.addEventListener('click', () => this.jumpToIssue(issue));

		// Auto-fix (if available)
		if (issue.canAutoFix && issue.fixText) {
			const fixBtn = actions.createEl('button', { text: 'Auto-fix', cls: 'issue-action-btn mod-cta' });
			fixBtn.addEventListener('click', () => this.autoFixIssue(issue));
		}

		// Ignore
		const ignoreBtn = actions.createEl('button', { text: 'Ignore', cls: 'issue-action-btn' });
		ignoreBtn.addEventListener('click', () => this.ignoreIssue(issue));
	}

	/**
	 * Get icon for severity
	 */
	private getSeverityIcon(severity: IssueSeverity): string {
		switch (severity) {
			case 'error': return 'x-circle';
			case 'warning': return 'alert-triangle';
			case 'info': return 'info';
			case 'suggestion': return 'lightbulb';
			default: return 'circle';
		}
	}

	/**
	 * Jump to issue location in editor
	 */
	private async jumpToIssue(issue: StyleIssue): Promise<void> {
		if (!this.currentFile) return;

		const leaf = this.app.workspace.getLeaf(false);
		await leaf.openFile(this.currentFile);

		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) return;

		const editor = view.editor;

		// Jump to line
		editor.setCursor({ line: issue.line - 1, ch: issue.column - 1 });
		editor.scrollIntoView({ from: { line: issue.line - 1, ch: 0 }, to: { line: issue.line, ch: 0 } }, true);
	}

	/**
	 * Auto-fix an issue
	 */
	private async autoFixIssue(issue: StyleIssue): Promise<void> {
		if (!this.currentFile || !issue.fixText) return;

		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			new Notice('Please open the file in the editor first');
			return;
		}

		const editor = view.editor;
		const content = editor.getValue();

		// Find and replace the text at the specific offset
		const before = content.substring(0, issue.offset);
		const after = content.substring(issue.offset + issue.length);
		const newContent = before + issue.fixText + after;

		editor.setValue(newContent);
		new Notice('Issue fixed');

		// Re-check
		setTimeout(() => this.checkActiveFile(), 100);
	}

	/**
	 * Ignore an issue
	 */
	private ignoreIssue(issue: StyleIssue): void {
		// Mark as ignored (would be saved to settings)
		issue.ignored = true;
		new Notice('Issue ignored');
		this.render();
	}

	/**
	 * Load all rules (built-in + custom)
	 */
	private loadRules(): void {
		const builtInRules = getAllBuiltInRules();
		const customRules = this.plugin.settings.styleChecker.customRules || [];

		// Combine all rules
		const allRules = [...builtInRules, ...customRules];

		this.checker.setEnabledRules(allRules);
	}

	/**
	 * Show settings menu
	 */
	private showSettingsMenu(e: MouseEvent): void {
		const menu = new Menu();

		menu.addItem(item => item
			.setTitle('Manage Custom Rules')
			.setIcon('edit')
			.onClick(() => this.openCustomRulesManager())
		);

		menu.addSeparator();

		menu.addItem(item => item
			.setTitle('Enable All Rules')
			.setIcon('check-circle')
			.onClick(() => {
				const rules = getAllBuiltInRules().map(r => ({ ...r, enabled: true }));
				this.checker.setEnabledRules(rules);
				this.checkActiveFile();
			})
		);

		menu.addItem(item => item
			.setTitle('Disable All Rules')
			.setIcon('x-circle')
			.onClick(() => {
				this.checker.setEnabledRules([]);
				this.checkActiveFile();
			})
		);

		menu.addSeparator();

		menu.addItem(item => item
			.setTitle('Analyze Tense')
			.setIcon('clock')
			.onClick(() => this.showTenseAnalysis())
		);

		menu.addItem(item => item
			.setTitle('Analyze POV')
			.setIcon('user')
			.onClick(() => this.showPOVAnalysis())
		);

		menu.addItem(item => item
			.setTitle('Readability Metrics')
			.setIcon('bar-chart')
			.onClick(() => this.showReadabilityMetrics())
		);

		menu.addSeparator();

		menu.addItem(item => item
			.setTitle('Export Report (Markdown)')
			.setIcon('file-text')
			.onClick(() => this.exportReport('markdown'))
		);

		menu.addItem(item => item
			.setTitle('Export Report (HTML)')
			.setIcon('code')
			.onClick(() => this.exportReport('html'))
		);

		menu.showAtMouseEvent(e);
	}

	/**
	 * Show tense analysis
	 */
	private async showTenseAnalysis(): Promise<void> {
		if (!this.currentFile) return;

		const content = await this.app.vault.read(this.currentFile);
		const analysis = this.checker.analyzeTense(content);

		new Notice(
			`Tense Analysis:\n` +
			`Dominant: ${analysis.dominantTense}\n` +
			`Past: ${analysis.pastTenseCount}\n` +
			`Present: ${analysis.presentTenseCount}\n` +
			`Future: ${analysis.futureTenseCount}\n` +
			`Confidence: ${(analysis.confidence * 100).toFixed(1)}%`,
			5000
		);
	}

	/**
	 * Show POV analysis
	 */
	private async showPOVAnalysis(): Promise<void> {
		if (!this.currentFile) return;

		const content = await this.app.vault.read(this.currentFile);
		const analysis = this.checker.analyzePOV(content);

		new Notice(
			`POV Analysis:\n` +
			`Dominant: ${analysis.dominantPOV}\n` +
			`First person: ${analysis.firstPersonCount}\n` +
			`Second person: ${analysis.secondPersonCount}\n` +
			`Third person: ${analysis.thirdPersonCount}\n` +
			`Confidence: ${(analysis.confidence * 100).toFixed(1)}%`,
			5000
		);
	}

	/**
	 * Show readability metrics
	 */
	private async showReadabilityMetrics(): Promise<void> {
		if (!this.currentFile) return;

		const content = await this.app.vault.read(this.currentFile);
		const metrics = this.checker.calculateReadability(content);

		new Notice(
			`Readability Metrics:\n` +
			`Flesch-Kincaid Grade: ${metrics.fleschKincaidGrade.toFixed(1)}\n` +
			`Reading Ease: ${metrics.fleschReadingEase.toFixed(1)}/100\n` +
			`Avg Words/Sentence: ${metrics.avgWordsPerSentence.toFixed(1)}\n` +
			`Complex Words: ${metrics.complexWords}`,
			5000
		);
	}

	/**
	 * Open custom rules manager
	 */
	private openCustomRulesManager(): void {
		const customRules = this.plugin.settings.styleChecker.customRules || [];

		new CustomRulesManagerModal(
			this.app,
			customRules,
			async (rules) => {
				// Save custom rules to settings
				if (!this.plugin.settings.styleChecker.customRules) {
					this.plugin.settings.styleChecker.customRules = [];
				}
				this.plugin.settings.styleChecker.customRules = rules;
				await this.plugin.saveSettings();

				// Reload rules and re-check
				this.loadRules();
				this.checkActiveFile();
			}
		).open();
	}

	/**
	 * Export style report
	 */
	private async exportReport(format: 'markdown' | 'html'): Promise<void> {
		if (!this.currentFile || !this.currentResult) {
			new Notice('No style check results to export');
			return;
		}

		await this.reportGenerator.exportReport(this.currentFile, this.currentResult, format);
	}
}
