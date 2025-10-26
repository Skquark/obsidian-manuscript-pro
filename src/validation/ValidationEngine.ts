/**
 * Validation Engine
 * Coordinates validation rules and aggregates results
 */

import { TFile } from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import type {
	ValidationIssue,
	ValidationResults,
	ValidationSummary,
	ValidationContext,
	ValidationRule,
	ValidationCategory,
	ValidationSeverity,
} from './ValidationInterfaces';
import type { ValidationIssue as CrossRefValidationIssue } from '../crossref/CrossRefInterfaces';

export class ValidationEngine {
	private rules: ValidationRule[] = [];

	constructor(private plugin: LatexPandocConcealerPlugin) {
		this.registerDefaultRules();
	}

	/**
	 * Register all default validation rules
	 */
	private registerDefaultRules(): void {
		// Reference validation rules
		if (this.plugin.settings.validation?.validateReferences !== false) {
			this.rules.push({
				id: 'undefined-references',
				name: 'Undefined References',
				description: 'Check for \\ref{} commands that point to non-existent labels',
				category: 'reference',
				severity: 'error',
				enabled: true,
				validate: this.validateUndefinedReferences.bind(this),
			});

			this.rules.push({
				id: 'duplicate-labels',
				name: 'Duplicate Labels',
				description: 'Check for duplicate \\label{} definitions',
				category: 'reference',
				severity: 'error',
				enabled: true,
				validate: this.validateDuplicateLabels.bind(this),
			});

			this.rules.push({
				id: 'orphaned-labels',
				name: 'Orphaned Labels',
				description: 'Check for labels that are never referenced',
				category: 'reference',
				severity: 'warning',
				enabled: true,
				validate: this.validateOrphanedLabels.bind(this),
			});
		}

		// Citation validation rules
		if (this.plugin.settings.validation?.validateCitations !== false) {
			this.rules.push({
				id: 'missing-citations',
				name: 'Missing Bibliography Entries',
				description: 'Check for citations without corresponding bib entries',
				category: 'citation',
				severity: 'error',
				enabled: true,
				validate: this.validateMissingCitations.bind(this),
			});

			this.rules.push({
				id: 'orphaned-bib-entries',
				name: 'Orphaned Bibliography Entries',
				description: 'Check for bib entries never cited in text',
				category: 'citation',
				severity: 'warning',
				enabled: true,
				validate: this.validateOrphanedBibEntries.bind(this),
			});
		}

		// Figure validation rules
		if (this.plugin.settings.validation?.validateFigures !== false) {
			this.rules.push({
				id: 'figures-missing-labels',
				name: 'Figures Without Labels',
				description: 'Check for figures without \\label{} commands',
				category: 'figure',
				severity: 'warning',
				enabled: true,
				validate: this.validateFigureLabels.bind(this),
			});

			this.rules.push({
				id: 'figures-missing-captions',
				name: 'Figures Without Captions',
				description: 'Check for figures without captions',
				category: 'figure',
				severity: 'warning',
				enabled: true,
				validate: this.validateFigureCaptions.bind(this),
			});

			this.rules.push({
				id: 'figure-numbering',
				name: 'Figure Numbering Consistency',
				description: 'Check for sequential figure numbering',
				category: 'figure',
				severity: 'info',
				enabled: true,
				validate: this.validateFigureNumbering.bind(this),
			});
		}

		// Table validation rules
		if (this.plugin.settings.validation?.validateTables !== false) {
			this.rules.push({
				id: 'tables-missing-labels',
				name: 'Tables Without Labels',
				description: 'Check for tables without \\label{} commands',
				category: 'table',
				severity: 'warning',
				enabled: true,
				validate: this.validateTableLabels.bind(this),
			});

			this.rules.push({
				id: 'tables-missing-captions',
				name: 'Tables Without Captions',
				description: 'Check for tables without captions',
				category: 'table',
				severity: 'warning',
				enabled: true,
				validate: this.validateTableCaptions.bind(this),
			});
		}

		// Structure validation rules
		if (this.plugin.settings.validation?.validateStructure !== false) {
			this.rules.push({
				id: 'empty-sections',
				name: 'Empty Sections',
				description: 'Check for sections with no content',
				category: 'structure',
				severity: 'info',
				enabled: true,
				validate: this.validateEmptySections.bind(this),
			});

			this.rules.push({
				id: 'heading-levels',
				name: 'Inconsistent Heading Levels',
				description: 'Check for skipped heading levels (e.g., # to ###)',
				category: 'structure',
				severity: 'warning',
				enabled: true,
				validate: this.validateHeadingLevels.bind(this),
			});
		}
	}

	/**
	 * Run all validation rules on the manuscript
	 */
	async validateManuscript(files?: string[]): Promise<ValidationResults> {
		const startTime = Date.now();

		// Determine which files to validate
		let filesToValidate: TFile[] = [];

		if (files && files.length > 0) {
			// Validate specific files
			filesToValidate = files
				.map((path) => this.plugin.app.vault.getAbstractFileByPath(path))
				.filter((file): file is TFile => file instanceof TFile);
		} else {
			// Validate all markdown files
			filesToValidate = this.plugin.app.vault.getMarkdownFiles();
		}

		const context: ValidationContext = {
			files: filesToValidate.map((f) => f.path),
			plugin: this.plugin,
		};

		// Run all enabled rules
		const allIssues: ValidationIssue[] = [];
		for (const rule of this.rules.filter((r) => r.enabled)) {
			try {
				const issues = await rule.validate(context);
				allIssues.push(...issues);
			} catch (error) {
				console.error(`Validation rule ${rule.id} failed:`, error);
			}
		}

		// Generate summary
		const summary = this.generateSummary(allIssues);

		const results: ValidationResults = {
			timestamp: startTime,
			filesScanned: filesToValidate.length,
			issues: allIssues,
			summary,
		};

		if (this.plugin.settings.debugMode) {
			console.log('Validation completed:', results);
		}

		return results;
	}

	/**
	 * Generate summary statistics
	 */
	private generateSummary(issues: ValidationIssue[]): ValidationSummary {
		const summary: ValidationSummary = {
			total: issues.length,
			bySeverity: {
				critical: 0,
				error: 0,
				warning: 0,
				info: 0,
			},
			byCategory: {
				reference: 0,
				citation: 0,
				figure: 0,
				table: 0,
				equation: 0,
				structure: 0,
				format: 0,
				consistency: 0,
			},
		};

		for (const issue of issues) {
			summary.bySeverity[issue.severity]++;
			summary.byCategory[issue.category]++;
		}

		return summary;
	}

	// ========================================
	// VALIDATION RULE IMPLEMENTATIONS
	// ========================================

	/**
	 * Check for undefined references
	 */
	private async validateUndefinedReferences(context: ValidationContext): Promise<ValidationIssue[]> {
		const issues: ValidationIssue[] = [];

		if (!this.plugin.crossRefManager) {
			return issues;
		}

		const validationResults = this.plugin.crossRefManager.validateReferences();

		for (const result of validationResults) {
			if (result.type === 'undefined-ref' && result.severity === 'error') {
				issues.push({
					id: `undefined-ref-${result.location.file}-${result.location.line}`,
					severity: 'error',
					category: 'reference',
					message: result.message,
					location: {
						file: result.location.file,
						line: result.location.line,
						ch: result.location.ch,
					},
					suggestion:
						result.suggestions && result.suggestions.length > 0 ?
							`Did you mean: ${result.suggestions.join(', ')}?`
						:	undefined,
					autoFixable: false,
				});
			}
		}

		return issues;
	}

	/**
	 * Check for duplicate labels
	 */
	private async validateDuplicateLabels(context: ValidationContext): Promise<ValidationIssue[]> {
		const issues: ValidationIssue[] = [];

		if (!this.plugin.crossRefManager) {
			return issues;
		}

		const validationResults = this.plugin.crossRefManager.validateReferences();

		for (const result of validationResults) {
			if (result.type === 'duplicate-label') {
				issues.push({
					id: `duplicate-label-${result.location.file}-${result.location.line}`,
					severity: result.severity === 'error' ? 'error' : 'warning',
					category: 'reference',
					message: result.message,
					location: {
						file: result.location.file,
						line: result.location.line,
						ch: result.location.ch,
					},
					suggestion: 'Rename one of the duplicate labels to make them unique',
					autoFixable: false,
				});
			}
		}

		return issues;
	}

	/**
	 * Check for orphaned labels
	 */
	private async validateOrphanedLabels(context: ValidationContext): Promise<ValidationIssue[]> {
		const issues: ValidationIssue[] = [];

		if (!this.plugin.crossRefManager) {
			return issues;
		}

		const validationResults = this.plugin.crossRefManager.validateReferences();

		for (const result of validationResults) {
			if (result.type === 'orphaned-label') {
				issues.push({
					id: `orphaned-label-${result.location.file}-${result.location.line}`,
					severity: 'info',
					category: 'reference',
					message: result.message,
					location: {
						file: result.location.file,
						line: result.location.line,
						ch: result.location.ch,
					},
					suggestion: 'Consider removing unused labels or add references to them',
					autoFixable: false,
				});
			}
		}

		return issues;
	}

	/**
	 * Check for missing bibliography entries
	 */
	private async validateMissingCitations(context: ValidationContext): Promise<ValidationIssue[]> {
		const issues: ValidationIssue[] = [];

		if (!this.plugin.bibliographyManager) {
			return issues;
		}

		// Get all citation keys used in documents
		const citationPattern = /\\cite(?:\[[^\]]*\])?\{([^}]+)\}/g;
		const usedCitations = new Set<string>();

		for (const filePath of context.files) {
			const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
			if (!(file instanceof TFile)) continue;

			const content = await this.plugin.app.vault.read(file);
			let match;

			while ((match = citationPattern.exec(content)) !== null) {
				const keys = match[1].split(',').map((k) => k.trim());
				keys.forEach((key) => usedCitations.add(key));
			}
		}

		// Check if each citation has a bib entry
		const bibEntries = this.plugin.bibliographyManager.getAllCitations();
		const bibKeys = new Set(bibEntries.keys());

		for (const citationKey of usedCitations) {
			if (!bibKeys.has(citationKey)) {
				issues.push({
					id: `missing-citation-${citationKey}`,
					severity: 'error',
					category: 'citation',
					message: `Citation key "${citationKey}" not found in bibliography`,
					location: { file: 'multiple' },
					suggestion: `Add an entry for "${citationKey}" to your .bib file`,
					autoFixable: false,
				});
			}
		}

		return issues;
	}

	/**
	 * Check for orphaned bibliography entries
	 */
	private async validateOrphanedBibEntries(context: ValidationContext): Promise<ValidationIssue[]> {
		const issues: ValidationIssue[] = [];

		if (!this.plugin.bibliographyManager) {
			return issues;
		}

		// Get all citation keys used in documents
		const citationPattern = /\\cite(?:\[[^\]]*\])?\{([^}]+)\}/g;
		const usedCitations = new Set<string>();

		for (const filePath of context.files) {
			const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
			if (!(file instanceof TFile)) continue;

			const content = await this.plugin.app.vault.read(file);
			let match;

			while ((match = citationPattern.exec(content)) !== null) {
				const keys = match[1].split(',').map((k) => k.trim());
				keys.forEach((key) => usedCitations.add(key));
			}
		}

		// Check for unused bib entries
		const bibEntries = this.plugin.bibliographyManager.getAllCitations();

		for (const [key, entry] of bibEntries) {
			if (!usedCitations.has(key)) {
				issues.push({
					id: `orphaned-bib-${key}`,
					severity: 'warning',
					category: 'citation',
					message: `Bibliography entry "${key}" is never cited`,
					location: { file: entry.file || 'bibliography' },
					suggestion: 'Consider removing unused entries or cite them in your text',
					autoFixable: false,
				});
			}
		}

		return issues;
	}

	/**
	 * Check for figures without labels
	 */
	private async validateFigureLabels(context: ValidationContext): Promise<ValidationIssue[]> {
		const issues: ValidationIssue[] = [];

		const figurePattern = /\\begin\{figure\}([\s\S]*?)\\end\{figure\}/g;
		const labelPattern = /\\label\{([^}]+)\}/;

		for (const filePath of context.files) {
			const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
			if (!(file instanceof TFile)) continue;

			const content = await this.plugin.app.vault.read(file);
			const lines = content.split('\n');
			let match;

			while ((match = figurePattern.exec(content)) !== null) {
				const figureContent = match[1];

				if (!labelPattern.test(figureContent)) {
					// Find line number
					const position = match.index;
					const lineNumber = content.substring(0, position).split('\n').length;

					issues.push({
						id: `figure-no-label-${filePath}-${lineNumber}`,
						severity: 'warning',
						category: 'figure',
						message: 'Figure without \\label{} command',
						location: { file: filePath, line: lineNumber },
						suggestion: 'Add \\label{fig:descriptive-name} after \\caption{}',
						autoFixable: false,
					});
				}
			}
		}

		return issues;
	}

	/**
	 * Check for figures without captions
	 */
	private async validateFigureCaptions(context: ValidationContext): Promise<ValidationIssue[]> {
		const issues: ValidationIssue[] = [];

		const figurePattern = /\\begin\{figure\}([\s\S]*?)\\end\{figure\}/g;
		const captionPattern = /\\caption\{/;

		for (const filePath of context.files) {
			const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
			if (!(file instanceof TFile)) continue;

			const content = await this.plugin.app.vault.read(file);
			let match;

			while ((match = figurePattern.exec(content)) !== null) {
				const figureContent = match[1];

				if (!captionPattern.test(figureContent)) {
					const position = match.index;
					const lineNumber = content.substring(0, position).split('\n').length;

					issues.push({
						id: `figure-no-caption-${filePath}-${lineNumber}`,
						severity: 'warning',
						category: 'figure',
						message: 'Figure without \\caption{} command',
						location: { file: filePath, line: lineNumber },
						suggestion: 'Add \\caption{Your figure description}',
						autoFixable: false,
					});
				}
			}
		}

		return issues;
	}

	/**
	 * Check figure numbering consistency
	 */
	private async validateFigureNumbering(context: ValidationContext): Promise<ValidationIssue[]> {
		const issues: ValidationIssue[] = [];

		// Extract all figure labels with chapter context
		const labelPattern = /\\label\{(fig:[^}]+)\}/g;

		for (const filePath of context.files) {
			const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
			if (!(file instanceof TFile)) continue;

			const content = await this.plugin.app.vault.read(file);
			const figureLabels: string[] = [];
			let match;

			while ((match = labelPattern.exec(content)) !== null) {
				figureLabels.push(match[1]);
			}

			// Check for numbering like fig:1.1, fig:1.2, fig:1.3
			const numbered = figureLabels.filter((label) => /fig:\d+\.\d+/.test(label));

			if (numbered.length > 0 && numbered.length !== figureLabels.length) {
				issues.push({
					id: `figure-numbering-${filePath}`,
					severity: 'info',
					category: 'figure',
					message: 'Inconsistent figure numbering scheme',
					location: { file: filePath },
					suggestion: 'Use consistent naming: either all numbered (fig:1.1) or all descriptive (fig:my-plot)',
					autoFixable: false,
				});
			}
		}

		return issues;
	}

	/**
	 * Check for tables without labels
	 */
	private async validateTableLabels(context: ValidationContext): Promise<ValidationIssue[]> {
		const issues: ValidationIssue[] = [];

		const tablePattern = /\\begin\{table\}([\s\S]*?)\\end\{table\}/g;
		const labelPattern = /\\label\{([^}]+)\}/;

		for (const filePath of context.files) {
			const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
			if (!(file instanceof TFile)) continue;

			const content = await this.plugin.app.vault.read(file);
			let match;

			while ((match = tablePattern.exec(content)) !== null) {
				const tableContent = match[1];

				if (!labelPattern.test(tableContent)) {
					const position = match.index;
					const lineNumber = content.substring(0, position).split('\n').length;

					issues.push({
						id: `table-no-label-${filePath}-${lineNumber}`,
						severity: 'warning',
						category: 'table',
						message: 'Table without \\label{} command',
						location: { file: filePath, line: lineNumber },
						suggestion: 'Add \\label{tab:descriptive-name} after \\caption{}',
						autoFixable: false,
					});
				}
			}
		}

		return issues;
	}

	/**
	 * Check for tables without captions
	 */
	private async validateTableCaptions(context: ValidationContext): Promise<ValidationIssue[]> {
		const issues: ValidationIssue[] = [];

		const tablePattern = /\\begin\{table\}([\s\S]*?)\\end\{table\}/g;
		const captionPattern = /\\caption\{/;

		for (const filePath of context.files) {
			const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
			if (!(file instanceof TFile)) continue;

			const content = await this.plugin.app.vault.read(file);
			let match;

			while ((match = tablePattern.exec(content)) !== null) {
				const tableContent = match[1];

				if (!captionPattern.test(tableContent)) {
					const position = match.index;
					const lineNumber = content.substring(0, position).split('\n').length;

					issues.push({
						id: `table-no-caption-${filePath}-${lineNumber}`,
						severity: 'warning',
						category: 'table',
						message: 'Table without \\caption{} command',
						location: { file: filePath, line: lineNumber },
						suggestion: 'Add \\caption{Your table description}',
						autoFixable: false,
					});
				}
			}
		}

		return issues;
	}

	/**
	 * Check for empty sections
	 */
	private async validateEmptySections(context: ValidationContext): Promise<ValidationIssue[]> {
		const issues: ValidationIssue[] = [];

		for (const filePath of context.files) {
			const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
			if (!(file instanceof TFile)) continue;

			const content = await this.plugin.app.vault.read(file);
			const lines = content.split('\n');

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];

				// Check if it's a heading
				if (/^#{1,6}\s+/.test(line)) {
					// Check if next non-empty line is another heading
					let nextContentLine = i + 1;
					while (nextContentLine < lines.length && lines[nextContentLine].trim() === '') {
						nextContentLine++;
					}

					if (nextContentLine < lines.length && /^#{1,6}\s+/.test(lines[nextContentLine])) {
						issues.push({
							id: `empty-section-${filePath}-${i}`,
							severity: 'info',
							category: 'structure',
							message: `Empty section: "${line.trim()}"`,
							location: { file: filePath, line: i + 1 },
							suggestion: 'Add content or remove the empty section',
							autoFixable: false,
						});
					}
				}
			}
		}

		return issues;
	}

	/**
	 * Check for inconsistent heading levels
	 */
	private async validateHeadingLevels(context: ValidationContext): Promise<ValidationIssue[]> {
		const issues: ValidationIssue[] = [];

		for (const filePath of context.files) {
			const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
			if (!(file instanceof TFile)) continue;

			const content = await this.plugin.app.vault.read(file);
			const lines = content.split('\n');

			let previousLevel = 0;

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				const match = line.match(/^(#{1,6})\s+/);

				if (match) {
					const currentLevel = match[1].length;

					// Check if we skipped a level (e.g., from # to ###)
					if (previousLevel > 0 && currentLevel > previousLevel + 1) {
						issues.push({
							id: `heading-skip-${filePath}-${i}`,
							severity: 'warning',
							category: 'structure',
							message: `Skipped heading level: from ${'#'.repeat(previousLevel)} to ${'#'.repeat(currentLevel)}`,
							location: { file: filePath, line: i + 1 },
							suggestion: `Use ${'#'.repeat(previousLevel + 1)} instead of ${'#'.repeat(currentLevel)}`,
							autoFixable: false,
						});
					}

					previousLevel = currentLevel;
				}
			}
		}

		return issues;
	}

	/**
	 * Get all registered rules
	 */
	getRules(): ValidationRule[] {
		return this.rules;
	}

	/**
	 * Enable/disable a specific rule
	 */
	setRuleEnabled(ruleId: string, enabled: boolean): void {
		const rule = this.rules.find((r) => r.id === ruleId);
		if (rule) {
			rule.enabled = enabled;
		}
	}
}
