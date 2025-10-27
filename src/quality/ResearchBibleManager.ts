/**
 * Research Knowledge Base Manager (Research Bible)
 *
 * Persistent storage of research facts, terminology, acronyms, and entities
 * with consistency checking and export capabilities.
 */

import { App, Notice, TFile } from 'obsidian';
import type ManuscriptProPlugin from '../main';
import {
	ResearchFact,
	EntityInfo,
	ResearchBible,
	FactCategory,
	EntityType,
	TerminologyConsistency,
} from './QualityInterfaces';

export class ResearchBibleManager {
	private app: App;
	private plugin: ManuscriptProPlugin;
	private bible: ResearchBible;

	constructor(plugin: ManuscriptProPlugin) {
		this.plugin = plugin;
		this.app = plugin.app;

		this.bible = {
			facts: [],
			terminology: new Map(),
			acronyms: new Map(),
			entities: new Map(),
			lastUpdated: new Date(),
		};
	}

	async initialize(): Promise<void> {
		await this.loadBible();

		if (this.plugin.settings.quality?.researchBible?.autoDetectTerms) {
			this.startAutoDetection();
		}
	}

	// ============================================
	// FACT MANAGEMENT
	// ============================================

	addFact(
		category: FactCategory,
		term: string,
		definition: string,
		source?: string,
		tags: string[] = [],
	): ResearchFact {
		const fact: ResearchFact = {
			id: Date.now().toString(),
			category,
			term,
			definition,
			source,
			tags,
			firstMentioned: this.app.workspace.getActiveFile()?.path,
			lastUpdated: new Date(),
			references: [],
		};

		this.bible.facts.push(fact);

		// Add to appropriate map
		if (category === 'definition') {
			this.bible.terminology.set(term.toLowerCase(), definition);
		} else if (category === 'acronym') {
			this.bible.acronyms.set(term.toUpperCase(), definition);
		}

		this.bible.lastUpdated = new Date();
		this.saveBible();

		new Notice(`Added: ${term}`);
		return fact;
	}

	removeFact(id: string): void {
		const fact = this.bible.facts.find((f) => f.id === id);
		if (!fact) return;

		// Remove from maps
		if (fact.category === 'definition') {
			this.bible.terminology.delete(fact.term.toLowerCase());
		} else if (fact.category === 'acronym') {
			this.bible.acronyms.delete(fact.term.toUpperCase());
		}

		this.bible.facts = this.bible.facts.filter((f) => f.id !== id);
		this.bible.lastUpdated = new Date();
		this.saveBible();

		new Notice(`Removed: ${fact.term}`);
	}

	updateFact(id: string, updates: Partial<ResearchFact>): void {
		const fact = this.bible.facts.find((f) => f.id === id);
		if (!fact) return;

		Object.assign(fact, updates);
		fact.lastUpdated = new Date();

		// Update maps if term or definition changed
		if (updates.term || updates.definition) {
			if (fact.category === 'definition') {
				this.bible.terminology.set(fact.term.toLowerCase(), fact.definition);
			} else if (fact.category === 'acronym') {
				this.bible.acronyms.set(fact.term.toUpperCase(), fact.definition);
			}
		}

		this.bible.lastUpdated = new Date();
		this.saveBible();
	}

	getFact(term: string): ResearchFact | undefined {
		return this.bible.facts.find((f) => f.term.toLowerCase() === term.toLowerCase());
	}

	searchFacts(query: string): ResearchFact[] {
		const lowerQuery = query.toLowerCase();
		return this.bible.facts.filter(
			(f) =>
				f.term.toLowerCase().includes(lowerQuery) ||
				f.definition.toLowerCase().includes(lowerQuery) ||
				f.tags.some((t) => t.toLowerCase().includes(lowerQuery)),
		);
	}

	getFactsByCategory(category: FactCategory): ResearchFact[] {
		return this.bible.facts.filter((f) => f.category === category);
	}

	// ============================================
	// ACRONYM MANAGEMENT
	// ============================================

	addAcronym(acronym: string, expansion: string, source?: string): ResearchFact {
		return this.addFact('acronym', acronym.toUpperCase(), expansion, source);
	}

	getAcronymExpansion(acronym: string): string | undefined {
		return this.bible.acronyms.get(acronym.toUpperCase());
	}

	hasAcronym(acronym: string): boolean {
		return this.bible.acronyms.has(acronym.toUpperCase());
	}

	getAllAcronyms(): Map<string, string> {
		return new Map(this.bible.acronyms);
	}

	// ============================================
	// TERMINOLOGY MANAGEMENT
	// ============================================

	addTerm(term: string, definition: string, source?: string): ResearchFact {
		return this.addFact('definition', term, definition, source);
	}

	getTermDefinition(term: string): string | undefined {
		return this.bible.terminology.get(term.toLowerCase());
	}

	hasTerm(term: string): boolean {
		return this.bible.terminology.has(term.toLowerCase());
	}

	getAllTerms(): Map<string, string> {
		return new Map(this.bible.terminology);
	}

	// ============================================
	// ENTITY MANAGEMENT
	// ============================================

	addEntity(
		name: string,
		type: EntityType,
		description: string,
		alternateNames: string[] = [],
		affiliations?: string[],
	): EntityInfo {
		const entity: EntityInfo = {
			name,
			type,
			alternateNames,
			description,
			affiliations,
			firstMentioned: this.app.workspace.getActiveFile()?.path || '',
			mentionCount: 0,
			lastUpdated: new Date(),
		};

		this.bible.entities.set(name.toLowerCase(), entity);
		this.bible.lastUpdated = new Date();
		this.saveBible();

		new Notice(`Added entity: ${name}`);
		return entity;
	}

	updateEntity(name: string, updates: Partial<EntityInfo>): void {
		const entity = this.bible.entities.get(name.toLowerCase());
		if (!entity) return;

		Object.assign(entity, updates);
		entity.lastUpdated = new Date();
		this.bible.lastUpdated = new Date();
		this.saveBible();
	}

	getEntity(name: string): EntityInfo | undefined {
		// Check exact match
		const entity = this.bible.entities.get(name.toLowerCase());
		if (entity) return entity;

		// Check alternate names
		for (const [, e] of this.bible.entities) {
			if (e.alternateNames.some((alt) => alt.toLowerCase() === name.toLowerCase())) {
				return e;
			}
		}

		return undefined;
	}

	removeEntity(name: string): void {
		this.bible.entities.delete(name.toLowerCase());
		this.bible.lastUpdated = new Date();
		this.saveBible();

		new Notice(`Removed entity: ${name}`);
	}

	getAllEntities(): Map<string, EntityInfo> {
		return new Map(this.bible.entities);
	}

	getEntitiesByType(type: EntityType): EntityInfo[] {
		return Array.from(this.bible.entities.values()).filter((e) => e.type === type);
	}

	// ============================================
	// TERMINOLOGY CONSISTENCY CHECKING
	// ============================================

	async checkTerminologyConsistency(): Promise<TerminologyConsistency[]> {
		const issues: TerminologyConsistency[] = [];
		const file = this.app.workspace.getActiveFile();
		if (!file) return issues;

		const content = await this.app.vault.read(file);
		const lines = content.split('\n');

		// Check for term variations
		for (const [term] of this.bible.terminology) {
			const variations = this.findTermVariations(term, content, lines);

			if (variations.locations.length > 0) {
				issues.push({
					term,
					variations: variations.variations,
					locations: variations.locations,
					suggestion: `Use "${term}" consistently`,
					confidence: variations.confidence,
				});
			}
		}

		// Check for acronym inconsistencies
		for (const [acronym, expansion] of this.bible.acronyms) {
			const inconsistent = this.findAcronymInconsistencies(acronym, expansion, content, lines);

			if (inconsistent.length > 0) {
				issues.push({
					term: acronym,
					variations: inconsistent,
					locations: [],
					suggestion: `Define "${acronym}" as "${expansion}" on first use`,
					confidence: 0.8,
				});
			}
		}

		return issues;
	}

	private findTermVariations(
		term: string,
		content: string,
		lines: string[],
	): { variations: string[]; locations: { file: string; line: number }[]; confidence: number } {
		const variations: Set<string> = new Set();
		const locations: { file: string; line: number }[] = [];
		const file = this.app.workspace.getActiveFile()?.path || '';

		// Look for case variations
		const patterns = [
			term,
			term.toLowerCase(),
			term.toUpperCase(),
			term.charAt(0).toUpperCase() + term.slice(1).toLowerCase(),
		];

		const regex = new RegExp(`\\b(${patterns.join('|')})\\b`, 'gi');
		let match;

		while ((match = regex.exec(content)) !== null) {
			const found = match[1];
			if (found !== term) {
				variations.add(found);

				// Find line number
				const lineNum = content.substring(0, match.index).split('\n').length;
				locations.push({ file, line: lineNum });
			}
		}

		return {
			variations: Array.from(variations),
			locations,
			confidence: variations.size > 0 ? 0.9 : 0,
		};
	}

	private findAcronymInconsistencies(acronym: string, expansion: string, content: string, lines: string[]): string[] {
		const inconsistencies: string[] = [];

		// Check if acronym is used without definition
		const acronymRegex = new RegExp(`\\b${acronym}\\b`, 'g');
		const expansionRegex = new RegExp(`\\b${expansion}\\b`, 'gi');

		const hasAcronym = acronymRegex.test(content);
		const hasExpansion = expansionRegex.test(content);

		if (hasAcronym && !hasExpansion) {
			inconsistencies.push(`${acronym} used without definition`);
		}

		return inconsistencies;
	}

	// ============================================
	// AUTO-DETECTION
	// ============================================

	private startAutoDetection(): void {
		// Detect acronyms and terms from document
		this.plugin.registerEvent(
			this.app.vault.on('modify', (file) => {
				if (file instanceof TFile) {
					this.detectTermsInFile(file);
				}
			}),
		);
	}

	private async detectTermsInFile(file: TFile): Promise<void> {
		const content = await this.app.vault.read(file);

		// Detect acronyms (all caps words, 2-6 letters)
		const acronymRegex = /\b([A-Z]{2,6})\b/g;
		let match;

		while ((match = acronymRegex.exec(content)) !== null) {
			const acronym = match[1];
			if (!this.hasAcronym(acronym) && !this.isCommonWord(acronym)) {
				// Don't auto-add, just track for suggestion
				// Could show suggestion to user
			}
		}
	}

	private isCommonWord(word: string): boolean {
		const common = [
			'THE',
			'AND',
			'FOR',
			'ARE',
			'BUT',
			'NOT',
			'YOU',
			'ALL',
			'CAN',
			'HER',
			'WAS',
			'ONE',
			'OUR',
			'OUT',
			'DAY',
		];
		return common.includes(word);
	}

	// ============================================
	// REFERENCE TRACKING
	// ============================================

	trackReference(term: string, filePath: string): void {
		const fact = this.getFact(term);
		if (!fact) return;

		if (!fact.references.includes(filePath)) {
			fact.references.push(filePath);
			this.saveBible();
		}

		const entity = this.getEntity(term);
		if (entity) {
			entity.mentionCount++;
			this.saveBible();
		}
	}

	getUnusedFacts(): ResearchFact[] {
		return this.bible.facts.filter((f) => f.references.length === 0);
	}

	// ============================================
	// EXPORT FUNCTIONS
	// ============================================

	exportGlossary(format: 'markdown' | 'latex' | 'html' = 'markdown'): string {
		const terms = Array.from(this.bible.terminology.entries()).sort((a, b) => a[0].localeCompare(b[0]));

		switch (format) {
			case 'markdown':
				return this.exportGlossaryMarkdown(terms);
			case 'latex':
				return this.exportGlossaryLatex(terms);
			case 'html':
				return this.exportGlossaryHTML(terms);
			default:
				return this.exportGlossaryMarkdown(terms);
		}
	}

	private exportGlossaryMarkdown(terms: [string, string][]): string {
		let md = '# Glossary\n\n';

		const grouped = this.groupByFirstLetter(terms);

		for (const [letter, items] of Object.entries(grouped)) {
			md += `## ${letter}\n\n`;
			for (const [term, def] of items) {
				md += `**${term}**: ${def}\n\n`;
			}
		}

		return md;
	}

	private exportGlossaryLatex(terms: [string, string][]): string {
		let tex = '\\begin{description}\n';

		for (const [term, def] of terms) {
			tex += `  \\item[${term}] ${def}\n`;
		}

		tex += '\\end{description}\n';
		return tex;
	}

	private exportGlossaryHTML(terms: [string, string][]): string {
		let html = '<dl class="glossary">\n';

		for (const [term, def] of terms) {
			html += `  <dt>${term}</dt>\n`;
			html += `  <dd>${def}</dd>\n`;
		}

		html += '</dl>\n';
		return html;
	}

	exportAcronymList(format: 'markdown' | 'latex' = 'markdown'): string {
		const acronyms = Array.from(this.bible.acronyms.entries()).sort((a, b) => a[0].localeCompare(b[0]));

		if (format === 'latex') {
			let tex = '\\begin{acronym}\n';
			for (const [acronym, expansion] of acronyms) {
				tex += `  \\acro{${acronym}}{${expansion}}\n`;
			}
			tex += '\\end{acronym}\n';
			return tex;
		} else {
			let md = '# Acronyms\n\n';
			for (const [acronym, expansion] of acronyms) {
				md += `- **${acronym}**: ${expansion}\n`;
			}
			return md;
		}
	}

	exportEntityIndex(format: 'markdown' | 'json' = 'markdown'): string {
		const entities = Array.from(this.bible.entities.values()).sort((a, b) => a.name.localeCompare(b.name));

		if (format === 'json') {
			return JSON.stringify(entities, null, 2);
		} else {
			let md = '# Entity Index\n\n';

			const byType: Record<EntityType, EntityInfo[]> = {
				person: [],
				organization: [],
				institution: [],
				concept: [],
			};

			for (const entity of entities) {
				byType[entity.type].push(entity);
			}

			for (const [type, items] of Object.entries(byType)) {
				if (items.length === 0) continue;

				md += `## ${type.charAt(0).toUpperCase() + type.slice(1)}s\n\n`;

				for (const entity of items) {
					md += `### ${entity.name}\n`;
					md += `${entity.description}\n`;

					if (entity.alternateNames.length > 0) {
						md += `*Also known as: ${entity.alternateNames.join(', ')}*\n`;
					}

					if (entity.affiliations && entity.affiliations.length > 0) {
						md += `*Affiliations: ${entity.affiliations.join(', ')}*\n`;
					}

					md += `\n`;
				}
			}

			return md;
		}
	}

	exportCompleteBible(): string {
		return JSON.stringify(
			{
				facts: this.bible.facts,
				terminology: Array.from(this.bible.terminology.entries()),
				acronyms: Array.from(this.bible.acronyms.entries()),
				entities: Array.from(this.bible.entities.values()),
				lastUpdated: this.bible.lastUpdated,
				exportedAt: new Date().toISOString(),
			},
			null,
			2,
		);
	}

	// ============================================
	// IMPORT FUNCTIONS
	// ============================================

	async importFromJSON(json: string): Promise<void> {
		try {
			const data = JSON.parse(json);

			if (data.facts) {
				this.bible.facts = data.facts;
			}

			if (data.terminology) {
				this.bible.terminology = new Map(data.terminology);
			}

			if (data.acronyms) {
				this.bible.acronyms = new Map(data.acronyms);
			}

			if (data.entities) {
				this.bible.entities = new Map(data.entities.map((e: EntityInfo) => [e.name.toLowerCase(), e]));
			}

			this.bible.lastUpdated = new Date();
			await this.saveBible();

			new Notice('Research Bible imported successfully');
		} catch (error) {
			new Notice('Failed to import: Invalid JSON');
			console.error('Import error:', error);
		}
	}

	// ============================================
	// UTILITY FUNCTIONS
	// ============================================

	private groupByFirstLetter(terms: [string, string][]): Record<string, [string, string][]> {
		const grouped: Record<string, [string, string][]> = {};

		for (const term of terms) {
			const letter = term[0].charAt(0).toUpperCase();
			if (!grouped[letter]) {
				grouped[letter] = [];
			}
			grouped[letter].push(term);
		}

		return grouped;
	}

	getStats(): {
		totalFacts: number;
		totalTerms: number;
		totalAcronyms: number;
		totalEntities: number;
		unusedFacts: number;
	} {
		return {
			totalFacts: this.bible.facts.length,
			totalTerms: this.bible.terminology.size,
			totalAcronyms: this.bible.acronyms.size,
			totalEntities: this.bible.entities.size,
			unusedFacts: this.getUnusedFacts().length,
		};
	}

	// ============================================
	// PERSISTENCE
	// ============================================

	private async loadBible(): Promise<void> {
		const data = await this.plugin.loadData();
		if (data?.researchBible) {
			const saved = data.researchBible;
			this.bible = {
				facts: saved.facts || [],
				terminology: new Map(saved.terminology || []),
				acronyms: new Map(saved.acronyms || []),
				entities: new Map(saved.entities || []),
				lastUpdated: new Date(saved.lastUpdated || Date.now()),
			};
		}
	}

	private async saveBible(): Promise<void> {
		const data = (await this.plugin.loadData()) || {};
		data.researchBible = {
			facts: this.bible.facts,
			terminology: Array.from(this.bible.terminology.entries()),
			acronyms: Array.from(this.bible.acronyms.entries()),
			entities: Array.from(this.bible.entities.entries()),
			lastUpdated: this.bible.lastUpdated.toISOString(),
		};
		await this.plugin.saveData(data);
	}

	/**
	 * Clear all data (use with caution)
	 */
	async clearAll(): Promise<void> {
		this.bible = {
			facts: [],
			terminology: new Map(),
			acronyms: new Map(),
			entities: new Map(),
			lastUpdated: new Date(),
		};

		await this.saveBible();
		new Notice('Research Bible cleared');
	}
}
