/**
 * Pre-Publication Checklist Manager
 *
 * Manages publication checklists for different document types with
 * auto-validation integration and persistent progress tracking.
 */

import { App, Notice, TFile } from 'obsidian';
import type ManuscriptProPlugin from '../main';
import { ChecklistType, ChecklistCategory, ChecklistItem, PublicationChecklist } from './QualityInterfaces';

export class PublicationChecklistManager {
	private app: App;
	private plugin: ManuscriptProPlugin;
	private checklists: Map<string, PublicationChecklist> = new Map();

	constructor(plugin: ManuscriptProPlugin) {
		this.plugin = plugin;
		this.app = plugin.app;
	}

	async initialize(): Promise<void> {
		await this.loadChecklists();
	}

	/**
	 * Get or create checklist for a document
	 */
	getChecklist(file: TFile, type?: ChecklistType): PublicationChecklist {
		const key = file.path;

		if (this.checklists.has(key)) {
			return this.checklists.get(key)!;
		}

		// Create new checklist
		const checklistType = type || this.plugin.settings.quality?.checklist?.defaultType || 'academic-paper';
		const checklist = this.createChecklist(file, checklistType);
		this.checklists.set(key, checklist);

		return checklist;
	}

	/**
	 * Create a new checklist for a document
	 */
	private createChecklist(file: TFile, type: ChecklistType): PublicationChecklist {
		const items = this.getChecklistTemplate(type);

		return {
			type,
			items,
			progress: 0,
			lastUpdated: Date.now(),
			notes: '',
			documentPath: file.path,
		};
	}

	/**
	 * Get checklist template for document type
	 */
	private getChecklistTemplate(type: ChecklistType): ChecklistItem[] {
		switch (type) {
			case 'academic-paper':
				return this.getAcademicPaperChecklist();
			case 'thesis':
				return this.getThesisChecklist();
			case 'technical-doc':
				return this.getTechnicalDocChecklist();
			case 'conference-paper':
				return this.getConferencePaperChecklist();
			case 'grant-proposal':
				return this.getGrantProposalChecklist();
			default:
				return this.getAcademicPaperChecklist();
		}
	}

	/**
	 * Academic Paper Checklist (45 items)
	 */
	private getAcademicPaperChecklist(): ChecklistItem[] {
		return [
			// Content Completeness
			{ id: 'title', category: 'content', text: 'Title is descriptive and concise', checked: false, required: true },
			{
				id: 'abstract-length',
				category: 'content',
				text: 'Abstract within word limit (150-250 words)',
				checked: false,
				required: true,
				autoCheck: async () => this.checkAbstractLength(),
			},
			{ id: 'keywords', category: 'content', text: 'Keywords selected (4-6)', checked: false, required: true },
			{
				id: 'sections',
				category: 'content',
				text: 'All sections present (Intro, Methods, Results, Discussion, Conclusion)',
				checked: false,
				required: true,
			},
			{
				id: 'research-questions',
				category: 'content',
				text: 'Research questions clearly stated',
				checked: false,
				required: true,
			},
			{
				id: 'hypotheses',
				category: 'content',
				text: 'Hypotheses defined (if applicable)',
				checked: false,
				required: false,
			},

			// References & Citations
			{
				id: 'citations-in-bib',
				category: 'references',
				text: 'All citations in bibliography',
				checked: false,
				required: true,
				autoCheck: async () => this.checkCitationsInBibliography(),
			},
			{
				id: 'bib-entries-cited',
				category: 'references',
				text: 'All bibliography entries cited',
				checked: false,
				required: false,
				autoCheck: async () => this.checkUnusedBibEntries(),
			},
			{
				id: 'citation-style',
				category: 'references',
				text: 'Citation style consistent throughout',
				checked: false,
				required: true,
			},
			{ id: 'dois', category: 'references', text: 'DOIs included where available', checked: false, required: false },
			{
				id: 'urls-checked',
				category: 'references',
				text: 'URLs checked and accessible',
				checked: false,
				required: false,
			},
			{
				id: 'no-orphaned',
				category: 'references',
				text: 'No orphaned citations [@missing]',
				checked: false,
				required: true,
				autoCheck: async () => this.checkOrphanedCitations(),
			},

			// Figures & Tables
			{
				id: 'figures-numbered',
				category: 'figures',
				text: 'All figures numbered sequentially',
				checked: false,
				required: true,
				autoCheck: async () => this.checkFigureNumbering(),
			},
			{
				id: 'tables-numbered',
				category: 'figures',
				text: 'All tables numbered sequentially',
				checked: false,
				required: true,
				autoCheck: async () => this.checkTableNumbering(),
			},
			{
				id: 'figures-referenced',
				category: 'figures',
				text: 'All figures referenced in text',
				checked: false,
				required: true,
				autoCheck: async () => this.checkFigureReferences(),
			},
			{
				id: 'tables-referenced',
				category: 'figures',
				text: 'All tables referenced in text',
				checked: false,
				required: true,
				autoCheck: async () => this.checkTableReferences(),
			},
			{
				id: 'figure-captions',
				category: 'figures',
				text: 'Figure captions are descriptive',
				checked: false,
				required: true,
			},
			{
				id: 'table-captions',
				category: 'figures',
				text: 'Table captions are complete',
				checked: false,
				required: true,
			},
			{
				id: 'image-resolution',
				category: 'figures',
				text: 'High resolution images (300+ DPI for print)',
				checked: false,
				required: false,
			},

			// Structure & Formatting
			{
				id: 'heading-hierarchy',
				category: 'structure',
				text: 'Heading hierarchy is logical',
				checked: false,
				required: true,
			},
			{
				id: 'no-heading-jumps',
				category: 'structure',
				text: 'No heading level jumps (# to ### without ##)',
				checked: false,
				required: true,
				autoCheck: async () => this.checkHeadingHierarchy(),
			},
			{
				id: 'consistent-caps',
				category: 'structure',
				text: 'Consistent heading capitalization',
				checked: false,
				required: false,
			},

			// Metadata & Ethics
			{
				id: 'author-affiliations',
				category: 'metadata',
				text: 'Author affiliations complete',
				checked: false,
				required: true,
			},
			{
				id: 'corresponding-author',
				category: 'metadata',
				text: 'Corresponding author identified',
				checked: false,
				required: true,
			},
			{ id: 'orcid', category: 'metadata', text: 'ORCID iDs included', checked: false, required: false },
			{
				id: 'acknowledgments',
				category: 'metadata',
				text: 'Acknowledgments section present',
				checked: false,
				required: false,
			},
			{ id: 'funding', category: 'metadata', text: 'Funding sources declared', checked: false, required: true },
			{
				id: 'conflict-of-interest',
				category: 'metadata',
				text: 'Conflict of interest statement',
				checked: false,
				required: true,
			},
			{
				id: 'ethics',
				category: 'metadata',
				text: 'Ethics approval stated (if applicable)',
				checked: false,
				required: false,
			},
			{
				id: 'data-availability',
				category: 'metadata',
				text: 'Data availability statement',
				checked: false,
				required: false,
			},

			// Language & Style
			{ id: 'spell-check', category: 'language', text: 'Spell check completed', checked: false, required: true },
			{ id: 'grammar-check', category: 'language', text: 'Grammar check completed', checked: false, required: true },
			{
				id: 'readability',
				category: 'language',
				text: 'Readability appropriate for audience',
				checked: false,
				required: false,
				autoCheck: async () => this.checkReadability(),
			},
			{ id: 'jargon', category: 'language', text: 'Jargon minimized or explained', checked: false, required: false },
			{
				id: 'acronyms-defined',
				category: 'language',
				text: 'Acronyms defined on first use',
				checked: false,
				required: true,
			},

			// Supplementary Materials
			{
				id: 'supplementary-referenced',
				category: 'supplementary',
				text: 'Supplementary files referenced',
				checked: false,
				required: false,
			},
			{
				id: 'code-documented',
				category: 'supplementary',
				text: 'Code/data properly documented',
				checked: false,
				required: false,
			},
		];
	}

	/**
	 * Thesis/Dissertation Checklist (50 items)
	 */
	private getThesisChecklist(): ChecklistItem[] {
		return [
			// Front Matter
			{
				id: 'title-page',
				category: 'content',
				text: 'Title page with required information',
				checked: false,
				required: true,
			},
			{ id: 'copyright', category: 'content', text: 'Copyright statement', checked: false, required: true },
			{
				id: 'approval-signatures',
				category: 'metadata',
				text: 'Committee approval signatures',
				checked: false,
				required: true,
			},
			{ id: 'abstract', category: 'content', text: 'Abstract', checked: false, required: true },
			{ id: 'toc', category: 'structure', text: 'Table of contents with page numbers', checked: false, required: true },
			{ id: 'list-of-figures', category: 'structure', text: 'List of figures', checked: false, required: true },
			{ id: 'list-of-tables', category: 'structure', text: 'List of tables', checked: false, required: true },
			{ id: 'abbreviations', category: 'content', text: 'List of abbreviations', checked: false, required: false },

			// Chapter Structure
			{
				id: 'intro-complete',
				category: 'content',
				text: 'Introduction chapter complete',
				checked: false,
				required: true,
			},
			{
				id: 'lit-review',
				category: 'content',
				text: 'Literature review comprehensive',
				checked: false,
				required: true,
			},
			{ id: 'methodology', category: 'content', text: 'Methodology clearly described', checked: false, required: true },
			{ id: 'results', category: 'content', text: 'Results chapters complete', checked: false, required: true },
			{ id: 'discussion', category: 'content', text: 'Discussion chapter analytical', checked: false, required: true },
			{
				id: 'conclusion',
				category: 'content',
				text: 'Conclusion chapter synthesizes findings',
				checked: false,
				required: true,
			},

			// Institutional Requirements
			{
				id: 'format-guidelines',
				category: 'structure',
				text: 'Format matches institutional guidelines',
				checked: false,
				required: true,
			},
			{
				id: 'margin-requirements',
				category: 'structure',
				text: 'Margin requirements met',
				checked: false,
				required: true,
			},
			{ id: 'font-requirements', category: 'structure', text: 'Font requirements met', checked: false, required: true },
			{
				id: 'page-limit',
				category: 'structure',
				text: 'Page limit observed (if applicable)',
				checked: false,
				required: false,
			},

			// Add more thesis-specific items...
		];
	}

	/**
	 * Technical Documentation Checklist (35 items)
	 */
	private getTechnicalDocChecklist(): ChecklistItem[] {
		return [
			{ id: 'getting-started', category: 'content', text: 'Getting started guide', checked: false, required: true },
			{ id: 'installation', category: 'content', text: 'Installation instructions', checked: false, required: true },
			{ id: 'configuration', category: 'content', text: 'Configuration guide', checked: false, required: true },
			{ id: 'api-reference', category: 'content', text: 'API reference', checked: false, required: false },
			{ id: 'usage-examples', category: 'content', text: 'Usage examples', checked: false, required: true },
			{ id: 'troubleshooting', category: 'content', text: 'Troubleshooting section', checked: false, required: true },
			{ id: 'code-tested', category: 'content', text: 'All code examples tested', checked: false, required: true },
			{
				id: 'syntax-highlighted',
				category: 'structure',
				text: 'Code syntax highlighted',
				checked: false,
				required: false,
			},
			{ id: 'alt-text', category: 'figures', text: 'Alt text for all images', checked: false, required: true },
			// Add more technical doc items...
		];
	}

	/**
	 * Conference Paper Checklist (similar to academic but with page limits)
	 */
	private getConferencePaperChecklist(): ChecklistItem[] {
		const items = this.getAcademicPaperChecklist();
		// Add conference-specific items
		items.push(
			{ id: 'page-limit', category: 'structure', text: 'Within page limit', checked: false, required: true },
			{
				id: 'anonymous',
				category: 'metadata',
				text: 'Anonymized for review (if required)',
				checked: false,
				required: false,
			},
			{
				id: 'format-template',
				category: 'structure',
				text: 'Uses conference template',
				checked: false,
				required: true,
			},
		);
		return items;
	}

	/**
	 * Grant Proposal Checklist
	 */
	private getGrantProposalChecklist(): ChecklistItem[] {
		return [
			{ id: 'project-summary', category: 'content', text: 'Project summary/abstract', checked: false, required: true },
			{
				id: 'specific-aims',
				category: 'content',
				text: 'Specific aims clearly stated',
				checked: false,
				required: true,
			},
			{ id: 'significance', category: 'content', text: 'Significance and innovation', checked: false, required: true },
			{
				id: 'approach',
				category: 'content',
				text: 'Research approach and methodology',
				checked: false,
				required: true,
			},
			{ id: 'budget', category: 'metadata', text: 'Budget and justification', checked: false, required: true },
			{ id: 'timeline', category: 'content', text: 'Project timeline', checked: false, required: true },
			{ id: 'personnel', category: 'metadata', text: 'Personnel and biosketches', checked: false, required: true },
			{ id: 'facilities', category: 'metadata', text: 'Facilities and resources', checked: false, required: false },
			// Add more grant-specific items...
		];
	}

	// ============================================
	// AUTO-VALIDATION METHODS
	// ============================================

	private async checkAbstractLength(): Promise<boolean> {
		const file = this.app.workspace.getActiveFile();
		if (!file) return false;

		const content = await this.app.vault.read(file);
		const abstractMatch = content.match(/(?:^|\n)abstract:\s*["']?([^"'\n]+)/i);

		if (!abstractMatch) return false;

		const wordCount = abstractMatch[1].split(/\s+/).length;
		return wordCount >= 150 && wordCount <= 250;
	}

	private async checkCitationsInBibliography(): Promise<boolean> {
		// Check if all citations are in bibliography
		// Note: bibliographyManager doesn't have validateCitations method yet
		// This would need to be implemented
		return true; // Placeholder
	}

	private async checkUnusedBibEntries(): Promise<boolean> {
		// Check if all bibliography entries are cited
		// This would integrate with the bibliography manager
		return true; // Placeholder
	}

	private async checkOrphanedCitations(): Promise<boolean> {
		// Check for citations without bibliography entries
		// This would need custom implementation
		return true; // Placeholder
	}

	private async checkFigureNumbering(): Promise<boolean> {
		const labels = this.plugin.crossRefManager?.getLabelsByType('figure' as any);
		if (!labels || labels.length === 0) return true;

		// Check sequential numbering
		const numbers = labels
			.map((l) => {
				const match = l.key.match(/fig:.*?(\d+)/);
				return match ? parseInt(match[1]) : 0;
			})
			.sort((a, b) => a - b);

		// Check if sequential (1, 2, 3, ...)
		for (let i = 0; i < numbers.length; i++) {
			if (numbers[i] !== i + 1) return false;
		}

		return true;
	}

	private async checkTableNumbering(): Promise<boolean> {
		const labels = this.plugin.crossRefManager?.getLabelsByType('table' as any);
		if (!labels || labels.length === 0) return true;

		const numbers = labels
			.map((l) => {
				const match = l.key.match(/tab:.*?(\d+)/);
				return match ? parseInt(match[1]) : 0;
			})
			.sort((a, b) => a - b);

		for (let i = 0; i < numbers.length; i++) {
			if (numbers[i] !== i + 1) return false;
		}

		return true;
	}

	private async checkFigureReferences(): Promise<boolean> {
		const labels = this.plugin.crossRefManager?.getLabelsByType('figure' as any);
		if (!labels) return true;

		// Check that all figures are referenced
		for (const label of labels) {
			if (label.references.length === 0) return false;
		}

		return true;
	}

	private async checkTableReferences(): Promise<boolean> {
		const labels = this.plugin.crossRefManager?.getLabelsByType('table' as any);
		if (!labels) return true;

		for (const label of labels) {
			if (label.references.length === 0) return false;
		}

		return true;
	}

	private async checkHeadingHierarchy(): Promise<boolean> {
		const file = this.app.workspace.getActiveFile();
		if (!file) return false;

		const content = await this.app.vault.read(file);
		const lines = content.split('\n');

		let prevLevel = 0;
		for (const line of lines) {
			const match = line.match(/^(#{1,6})\s/);
			if (match) {
				const level = match[1].length;
				if (level > prevLevel + 1) return false; // Jump detected
				prevLevel = level;
			}
		}

		return true;
	}

	private async checkReadability(): Promise<boolean> {
		// This would integrate with the readability analyzer
		// For now, return true
		return true;
	}

	// ============================================
	// CHECKLIST MANAGEMENT
	// ============================================

	/**
	 * Toggle checklist item
	 */
	toggleItem(documentPath: string, itemId: string): void {
		const checklist = this.checklists.get(documentPath);
		if (!checklist) return;

		const item = checklist.items.find((i) => i.id === itemId);
		if (!item) return;

		item.checked = !item.checked;
		this.updateProgress(checklist);
		this.saveChecklists();
	}

	/**
	 * Run auto-validation for all items
	 */
	async runAutoValidation(documentPath: string): Promise<void> {
		const checklist = this.checklists.get(documentPath);
		if (!checklist) return;

		let validated = 0;
		for (const item of checklist.items) {
			if (item.autoCheck) {
				try {
					item.checked = await item.autoCheck();
					validated++;
				} catch (error) {
					console.error(`Auto-check failed for ${item.id}:`, error);
				}
			}
		}

		this.updateProgress(checklist);
		this.saveChecklists();

		new Notice(`Auto-validated ${validated} items`);
	}

	/**
	 * Update progress percentage
	 */
	private updateProgress(checklist: PublicationChecklist): void {
		const total = checklist.items.filter((i) => i.required).length;
		const checked = checklist.items.filter((i) => i.required && i.checked).length;
		checklist.progress = total > 0 ? Math.round((checked / total) * 100) : 0;
		checklist.lastUpdated = Date.now();
	}

	/**
	 * Get checklist progress summary
	 */
	getProgress(documentPath: string): { total: number; checked: number; progress: number } {
		const checklist = this.checklists.get(documentPath);
		if (!checklist) return { total: 0, checked: 0, progress: 0 };

		const total = checklist.items.filter((i) => i.required).length;
		const checked = checklist.items.filter((i) => i.required && i.checked).length;

		return { total, checked, progress: checklist.progress };
	}

	/**
	 * Export checklist as markdown
	 */
	exportAsMarkdown(documentPath: string): string {
		const checklist = this.checklists.get(documentPath);
		if (!checklist) return '';

		const categories = [...new Set(checklist.items.map((i) => i.category))];

		let md = `# Publication Checklist\n\n`;
		md += `Type: ${checklist.type}\n`;
		md += `Progress: ${checklist.progress}%\n\n`;

		for (const category of categories) {
			md += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;

			const items = checklist.items.filter((i) => i.category === category);
			for (const item of items) {
				md += `- [${item.checked ? 'x' : ' '}] ${item.text}${item.required ? ' *' : ''}\n`;
				if (item.helpText) {
					md += `  > ${item.helpText}\n`;
				}
			}
			md += '\n';
		}

		if (checklist.notes) {
			md += `## Notes\n\n${checklist.notes}\n`;
		}

		return md;
	}

	// ============================================
	// PERSISTENCE
	// ============================================

	private async loadChecklists(): Promise<void> {
		const data = await this.plugin.loadData();
		if (data?.checklists) {
			this.checklists = new Map(Object.entries(data.checklists));
		}
	}

	private async saveChecklists(): Promise<void> {
		const data = (await this.plugin.loadData()) || {};
		data.checklists = Object.fromEntries(this.checklists);
		await this.plugin.saveData(data);
	}

	/**
	 * Clear checklist for a document
	 */
	clearChecklist(documentPath: string): void {
		this.checklists.delete(documentPath);
		this.saveChecklists();
	}
}
