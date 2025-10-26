/**
 * Cross-Reference Manager
 * Indexes labels and references, provides validation and navigation
 */

import { TFile, TFolder, Notice } from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import type {
	LabelEntry,
	ReferenceLocation,
	ValidationIssue,
	LabelType,
	RefType,
	Position,
	LabelSuggestion,
} from './CrossRefInterfaces';

export class CrossRefManager {
	private plugin: LatexPandocConcealerPlugin;
	private labels: Map<string, LabelEntry> = new Map();
	private indexedFiles: Set<string> = new Set();
	private lastIndexTime: number = 0;

	constructor(plugin: LatexPandocConcealerPlugin) {
		this.plugin = plugin;
	}

	/**
	 * Index all markdown files in vault
	 */
	async indexVault(): Promise<void> {
		this.labels.clear();
		this.indexedFiles.clear();

		const files = this.plugin.app.vault.getMarkdownFiles();
		for (const file of files) {
			await this.indexFile(file);
		}

		this.lastIndexTime = Date.now();

		if (this.plugin.settings.debugMode) {
			console.log(`CrossRef: Indexed ${this.labels.size} labels from ${this.indexedFiles.size} files`);
		}
	}

	/**
	 * Index a single file
	 */
	async indexFile(file: TFile): Promise<void> {
		try {
			const content = await this.plugin.app.vault.read(file);
			const labels = this.extractLabels(content, file.path);
			const references = this.extractReferences(content, file.path);

			// Add labels to index
			labels.forEach((label) => {
				const existing = this.labels.get(label.key);
				if (existing) {
					// Duplicate label - keep track of both
					existing.references.push(...label.references);
				} else {
					this.labels.set(label.key, label);
				}
			});

			// Associate references with labels
			references.forEach((refs, key) => {
				const label = this.labels.get(key);
				if (label) {
					label.references.push(...refs);
				}
			});

			this.indexedFiles.add(file.path);
		} catch (error) {
			console.error(`Failed to index ${file.path}:`, error);
		}
	}

	/**
	 * Extract labels from content
	 */
	extractLabels(content: string, filePath: string): LabelEntry[] {
		const labels: LabelEntry[] = [];
		const lines = content.split('\n');

		// Pattern: \label{key}
		const labelPattern = /\\label\{([^}]+)\}/g;

		lines.forEach((line, lineIndex) => {
			let match;
			while ((match = labelPattern.exec(line)) !== null) {
				const key = match[1];
				const ch = match.index;

				// Determine label type from context
				const type = this.determineLabelType(lines, lineIndex);

				// Extract context (surrounding text)
				const context = this.extractContext(lines, lineIndex, 2);

				// Extract metadata
				const metadata = this.extractLabelMetadata(lines, lineIndex, type);

				labels.push({
					key,
					type,
					file: filePath,
					position: { line: lineIndex, ch },
					context,
					references: [],
					metadata,
					createdAt: Date.now(),
				});
			}
		});

		return labels;
	}

	/**
	 * Determine label type from surrounding context
	 */
	private determineLabelType(lines: string[], lineIndex: number): LabelType {
		// Check current line and few lines before
		const contextLines = lines.slice(Math.max(0, lineIndex - 3), lineIndex + 1);
		const contextText = contextLines.join('\n').toLowerCase();

		// Check for section headings
		if (/^#{1,6}\s/.test(lines[lineIndex]) || contextText.includes('\\section') || contextText.includes('\\subsection')) {
			return contextText.includes('\\subsection') ? 'subsection' : 'section';
		}

		// Check for figures
		if (contextText.includes('\\begin{figure}') || contextText.includes('!\\[')) {
			return 'figure';
		}

		// Check for tables
		if (contextText.includes('\\begin{table}') || /^\|/.test(lines[lineIndex])) {
			return 'table';
		}

		// Check for equations
		if (
			contextText.includes('\\begin{equation}') ||
			contextText.includes('\\begin{align}') ||
			contextText.includes('$$')
		) {
			return 'equation';
		}

		// Check for listings
		if (contextText.includes('\\begin{listing}') || contextText.includes('```')) {
			return 'listing';
		}

		return 'other';
	}

	/**
	 * Extract metadata for label
	 */
	private extractLabelMetadata(lines: string[], lineIndex: number, type: LabelType): any {
		const metadata: any = {};

		if (type === 'section' || type === 'subsection') {
			// Extract section title
			const titleMatch = lines[lineIndex].match(/^#{1,6}\s+(.+)$/);
			if (titleMatch) {
				metadata.sectionTitle = titleMatch[1].trim();
			} else {
				const sectionMatch = lines[lineIndex].match(/\\(?:sub)?section\{([^}]+)\}/);
				if (sectionMatch) {
					metadata.sectionTitle = sectionMatch[1];
				}
			}
		}

		if (type === 'figure') {
			// Extract caption
			for (let i = lineIndex; i < Math.min(lineIndex + 5, lines.length); i++) {
				const captionMatch = lines[i].match(/\\caption\{([^}]+)\}/);
				if (captionMatch) {
					metadata.figureCaption = captionMatch[1];
					break;
				}
				// Markdown image alt text
				const mdMatch = lines[i].match(/!\[([^\]]+)\]/);
				if (mdMatch) {
					metadata.figureCaption = mdMatch[1];
					break;
				}
			}
		}

		if (type === 'table') {
			// Extract caption
			for (let i = lineIndex; i < Math.min(lineIndex + 5, lines.length); i++) {
				const captionMatch = lines[i].match(/\\caption\{([^}]+)\}/);
				if (captionMatch) {
					metadata.tableCaption = captionMatch[1];
					break;
				}
			}
		}

		return metadata;
	}

	/**
	 * Extract context around a line
	 */
	private extractContext(lines: string[], lineIndex: number, radius: number): string {
		const start = Math.max(0, lineIndex - radius);
		const end = Math.min(lines.length, lineIndex + radius + 1);
		return lines.slice(start, end).join(' ').substring(0, 200);
	}

	/**
	 * Extract references from content
	 */
	extractReferences(content: string, filePath: string): Map<string, ReferenceLocation[]> {
		const references = new Map<string, ReferenceLocation[]>();
		const lines = content.split('\n');

		// Pattern: \ref{key}, \eqref{key}, \cref{key}, \pageref{key}, \autoref{key}
		const refPattern = /\\(ref|eqref|cref|pageref|autoref)\{([^}]+)\}/g;

		lines.forEach((line, lineIndex) => {
			let match;
			while ((match = refPattern.exec(line)) !== null) {
				const refType = match[1] as RefType;
				const key = match[2];
				const ch = match.index;

				const context = this.extractContext(lines, lineIndex, 1);

				const location: ReferenceLocation = {
					file: filePath,
					position: { line: lineIndex, ch },
					refType,
					context,
				};

				if (!references.has(key)) {
					references.set(key, []);
				}
				references.get(key)!.push(location);
			}
		});

		return references;
	}

	/**
	 * Get label by key
	 */
	getLabel(key: string): LabelEntry | undefined {
		return this.labels.get(key);
	}

	/**
	 * Get all labels
	 */
	getAllLabels(): LabelEntry[] {
		return Array.from(this.labels.values());
	}

	/**
	 * Get labels by type
	 */
	getLabelsByType(type: LabelType): LabelEntry[] {
		return this.getAllLabels().filter((label) => label.type === type);
	}

	/**
	 * Get labels in file
	 */
	getLabelsInFile(filePath: string): LabelEntry[] {
		return this.getAllLabels().filter((label) => label.file === filePath);
	}

	/**
	 * Get suggestions for auto-completion
	 */
	getSuggestions(prefix: string, refType?: RefType, currentFile?: string): LabelSuggestion[] {
		const suggestions: LabelSuggestion[] = [];

		this.labels.forEach((label) => {
			// Filter by prefix
			if (!label.key.toLowerCase().includes(prefix.toLowerCase())) {
				return;
			}

			// Filter by type for specific ref commands
			if (refType === 'eqref' && label.type !== 'equation') {
				return;
			}

			// Calculate relevance score
			let score = 0;

			// Exact prefix match gets higher score
			if (label.key.toLowerCase().startsWith(prefix.toLowerCase())) {
				score += 100;
			}

			// Same file gets bonus
			if (currentFile && label.file === currentFile) {
				score += 50;
			}

			// Recent labels get bonus
			const ageHours = (Date.now() - label.createdAt) / (1000 * 60 * 60);
			score += Math.max(0, 20 - ageHours);

			// More references = more important
			score += label.references.length * 5;

			suggestions.push({
				key: label.key,
				type: label.type,
				context: label.context,
				score,
				file: label.file,
				line: label.position.line,
			});
		});

		// Sort by score descending
		suggestions.sort((a, b) => b.score - a.score);

		return suggestions.slice(0, 20); // Top 20 suggestions
	}

	/**
	 * Validate references
	 */
	validateReferences(filePath?: string): ValidationIssue[] {
		const issues: ValidationIssue[] = [];

		// Find undefined references
		const undefinedRefs = this.findUndefinedRefs(filePath);
		undefinedRefs.forEach(({ file, ref, position, context }) => {
			// Find similar labels for suggestions
			const similar = this.findSimilarLabels(ref, 3);

			issues.push({
				type: 'undefined-ref',
				severity: 'error',
				message: `Undefined reference: ${ref}`,
				location: { file, line: position.line, ch: position.ch },
				suggestions: similar.map((l) => l.key),
			});
		});

		// Find duplicate labels
		const duplicates = this.findDuplicateLabels();
		duplicates.forEach((labels, key) => {
			labels.forEach((label) => {
				issues.push({
					type: 'duplicate-label',
					severity: 'warning',
					message: `Duplicate label: ${key} (defined in ${labels.length} places)`,
					location: { file: label.file, line: label.position.line, ch: label.position.ch },
				});
			});
		});

		// Find orphaned labels (no references)
		if (!filePath) {
			// Only check for orphans in vault-wide validation
			const orphaned = this.findOrphanedLabels();
			orphaned.forEach((label) => {
				issues.push({
					type: 'orphaned-label',
					severity: 'info',
					message: `Orphaned label: ${label.key} (no references)`,
					location: { file: label.file, line: label.position.line, ch: label.position.ch },
				});
			});
		}

		return issues;
	}

	/**
	 * Find undefined references
	 */
	private findUndefinedRefs(filePath?: string): Array<{ file: string; ref: string; position: Position; context: string }> {
		const undefined: Array<{ file: string; ref: string; position: Position; context: string }> = [];
		const files = filePath ? [filePath] : Array.from(this.indexedFiles);

		for (const file of files) {
			const tfile = this.plugin.app.vault.getAbstractFileByPath(file);
			if (!(tfile instanceof TFile)) continue;

			this.plugin.app.vault.read(tfile).then((content) => {
				const refs = this.extractReferences(content, file);
				refs.forEach((locations, key) => {
					if (!this.labels.has(key)) {
						locations.forEach((loc) => {
							undefined.push({
								file: loc.file,
								ref: key,
								position: loc.position,
								context: loc.context,
							});
						});
					}
				});
			});
		}

		return undefined;
	}

	/**
	 * Find duplicate labels
	 */
	findDuplicateLabels(): Map<string, LabelEntry[]> {
		const duplicates = new Map<string, LabelEntry[]>();
		const keyCount = new Map<string, LabelEntry[]>();

		this.labels.forEach((label) => {
			if (!keyCount.has(label.key)) {
				keyCount.set(label.key, []);
			}
			keyCount.get(label.key)!.push(label);
		});

		keyCount.forEach((labels, key) => {
			if (labels.length > 1) {
				duplicates.set(key, labels);
			}
		});

		return duplicates;
	}

	/**
	 * Find orphaned labels (no references)
	 */
	findOrphanedLabels(): LabelEntry[] {
		return this.getAllLabels().filter((label) => label.references.length === 0);
	}

	/**
	 * Find similar labels using Levenshtein distance
	 */
	private findSimilarLabels(target: string, maxResults: number): LabelEntry[] {
		const results: Array<{ label: LabelEntry; distance: number }> = [];

		this.labels.forEach((label) => {
			const distance = this.levenshteinDistance(target.toLowerCase(), label.key.toLowerCase());
			if (distance <= 3) {
				// Max distance of 3
				results.push({ label, distance });
			}
		});

		results.sort((a, b) => a.distance - b.distance);
		return results.slice(0, maxResults).map((r) => r.label);
	}

	/**
	 * Levenshtein distance for fuzzy matching
	 */
	private levenshteinDistance(a: string, b: string): number {
		const matrix: number[][] = [];

		for (let i = 0; i <= b.length; i++) {
			matrix[i] = [i];
		}

		for (let j = 0; j <= a.length; j++) {
			matrix[0][j] = j;
		}

		for (let i = 1; i <= b.length; i++) {
			for (let j = 1; j <= a.length; j++) {
				if (b.charAt(i - 1) === a.charAt(j - 1)) {
					matrix[i][j] = matrix[i - 1][j - 1];
				} else {
					matrix[i][j] = Math.min(
						matrix[i - 1][j - 1] + 1, // substitution
						matrix[i][j - 1] + 1, // insertion
						matrix[i - 1][j] + 1, // deletion
					);
				}
			}
		}

		return matrix[b.length][a.length];
	}

	/**
	 * Generate label suggestion based on context
	 */
	generateLabel(context: string, type: LabelType): string {
		const prefix = this.getLabelPrefix(type);
		const slug = this.slugify(context);
		let candidate = `${prefix}:${slug}`;

		// Ensure uniqueness
		let counter = 1;
		while (this.labels.has(candidate)) {
			candidate = `${prefix}:${slug}-${counter}`;
			counter++;
		}

		return candidate;
	}

	/**
	 * Get conventional prefix for label type
	 */
	private getLabelPrefix(type: LabelType): string {
		const prefixes: Record<LabelType, string> = {
			section: 'sec',
			subsection: 'subsec',
			figure: 'fig',
			table: 'tab',
			equation: 'eq',
			listing: 'lst',
			other: 'item',
		};
		return prefixes[type];
	}

	/**
	 * Convert text to slug
	 */
	private slugify(text: string): string {
		return text
			.toLowerCase()
			.replace(/[^\w\s-]/g, '')
			.replace(/[\s_]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.substring(0, 30);
	}

	/**
	 * Validate label format
	 */
	validateLabelFormat(key: string): { valid: boolean; message?: string } {
		// Check for spaces
		if (/\s/.test(key)) {
			return { valid: false, message: 'Label contains spaces' };
		}

		// Check for special characters
		if (/[{}\\]/.test(key)) {
			return { valid: false, message: 'Label contains invalid characters: {}\\' };
		}

		// Check length
		if (key.length > 50) {
			return { valid: false, message: 'Label is too long (max 50 characters)' };
		}

		if (key.length === 0) {
			return { valid: false, message: 'Label is empty' };
		}

		return { valid: true };
	}

	/**
	 * Get statistics
	 */
	getStats(): {
		totalLabels: number;
		byType: Record<LabelType, number>;
		totalReferences: number;
		filesIndexed: number;
	} {
		const byType: Record<string, number> = {};
		let totalReferences = 0;

		this.labels.forEach((label) => {
			byType[label.type] = (byType[label.type] || 0) + 1;
			totalReferences += label.references.length;
		});

		return {
			totalLabels: this.labels.size,
			byType: byType as Record<LabelType, number>,
			totalReferences,
			filesIndexed: this.indexedFiles.size,
		};
	}
}
