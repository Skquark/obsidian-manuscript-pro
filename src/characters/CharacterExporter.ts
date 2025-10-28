import { App, TFile, Notice } from 'obsidian';
import { CharacterManager } from './CharacterManager';
import { Character } from './CharacterInterfaces';

/**
 * Character Export Options
 */
export interface CharacterExportOptions {
	format: 'markdown' | 'csv' | 'json';
	includeAppearance: boolean;
	includePersonality: boolean;
	includeBackground: boolean;
	includeArc: boolean;
	includeRelationships: boolean;
	includeAppearances: boolean;
	groupBy?: 'role' | 'importance' | 'alphabetical' | 'none';
}

/**
 * Character Database Exporter
 * Exports character data to various formats
 */
export class CharacterExporter {
	private app: App;
	private manager: CharacterManager;

	constructor(app: App, manager: CharacterManager) {
		this.app = app;
		this.manager = manager;
	}

	/**
	 * Export characters to markdown
	 */
	async exportToMarkdown(options: CharacterExportOptions): Promise<string> {
		const characters = this.getFilteredCharacters(options);
		let markdown = '';

		// Header
		markdown += '# Character Database Export\n\n';
		markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
		markdown += `**Total Characters:** ${characters.length}\n\n`;

		const stats = this.manager.getStatistics();
		markdown += `**By Role:** ${stats.byRole.protagonist} protagonists, ${stats.byRole.antagonist} antagonists, ${stats.byRole.supporting} supporting, ${stats.byRole.minor} minor\n\n`;

		markdown += '---\n\n';

		// Group characters
		const groupedCharacters = this.groupCharacters(characters, options.groupBy);

		if (options.groupBy === 'none') {
			markdown += this.renderCharacterList(characters, options);
		} else {
			for (const [groupName, groupCharacters] of Object.entries(groupedCharacters)) {
				markdown += `## ${groupName}\n\n`;
				markdown += this.renderCharacterList(groupCharacters, options);
				markdown += '\n';
			}
		}

		return markdown;
	}

	/**
	 * Render character list in markdown
	 */
	private renderCharacterList(characters: Character[], options: CharacterExportOptions): string {
		let markdown = '';

		characters.forEach((character, index) => {
			markdown += `### ${index + 1}. ${character.name}\n\n`;

			// Basic info
			markdown += `**Role:** ${character.role} | **Importance:** ${character.importance}\n\n`;

			if (character.tagline) {
				markdown += `> *${character.tagline}*\n\n`;
			}

			if (character.summary) {
				markdown += `${character.summary}\n\n`;
			}

			// Appearance
			if (options.includeAppearance && character.appearance) {
				markdown += '#### Appearance\n\n';
				const app = character.appearance;

				if (app.age) markdown += `- **Age:** ${app.age}\n`;
				if (app.gender) markdown += `- **Gender:** ${app.gender}\n`;
				if (app.height) markdown += `- **Height:** ${app.height}\n`;
				if (app.build) markdown += `- **Build:** ${app.build}\n`;
				if (app.hairColor) markdown += `- **Hair:** ${app.hairColor}${app.hairStyle ? `, ${app.hairStyle}` : ''}\n`;
				if (app.eyeColor) markdown += `- **Eyes:** ${app.eyeColor}\n`;
				if (app.skinTone) markdown += `- **Skin:** ${app.skinTone}\n`;
				if (app.distinguishingFeatures) markdown += `- **Distinguishing Features:** ${app.distinguishingFeatures}\n`;
				if (app.typicalClothing) markdown += `- **Typical Clothing:** ${app.typicalClothing}\n`;

				markdown += '\n';
			}

			// Personality
			if (options.includePersonality && character.personality) {
				markdown += '#### Personality\n\n';
				const pers = character.personality;

				if (pers.traits && pers.traits.length > 0) {
					markdown += `**Traits:** ${pers.traits.join(', ')}\n\n`;
				}
				if (pers.strengths && pers.strengths.length > 0) {
					markdown += `**Strengths:** ${pers.strengths.join(', ')}\n\n`;
				}
				if (pers.weaknesses && pers.weaknesses.length > 0) {
					markdown += `**Weaknesses:** ${pers.weaknesses.join(', ')}\n\n`;
				}
				if (pers.fears && pers.fears.length > 0) markdown += `**Fears:** ${pers.fears.join(', ')}\n\n`;
				if (pers.desires && pers.desires.length > 0) markdown += `**Desires:** ${pers.desires.join(', ')}\n\n`;
				if (pers.quirks && pers.quirks.length > 0) markdown += `**Quirks:** ${pers.quirks.join(', ')}\n\n`;
			}

			// Background
			if (options.includeBackground && character.background) {
				markdown += '#### Background\n\n';
				const bg = character.background;

				if (bg.birthplace) markdown += `**Birthplace:** ${bg.birthplace}\n\n`;
				if (bg.occupation) markdown += `**Occupation:** ${bg.occupation}\n\n`;
				if (bg.education) markdown += `**Education:** ${bg.education}\n\n`;
				if (bg.family) markdown += `**Family:** ${bg.family}\n\n`;
				if (bg.backstory) markdown += `**Backstory:** ${bg.backstory}\n\n`;
				if (bg.significantEvents && bg.significantEvents.length > 0) markdown += `**Significant Events:** ${bg.significantEvents.join(', ')}\n\n`;
			}

			// Character Arc
			if (options.includeArc && character.arc) {
				markdown += '#### Character Arc\n\n';
				const arc = character.arc;

				if (arc.startingState) markdown += `**Starting State:** ${arc.startingState}\n\n`;
				if (arc.goal) markdown += `**Goal:** ${arc.goal}\n\n`;
				if (arc.motivation) markdown += `**Motivation:** ${arc.motivation}\n\n`;
				if (arc.conflict) markdown += `**Conflict:** ${arc.conflict}\n\n`;
				if (arc.transformation) markdown += `**Transformation:** ${arc.transformation}\n\n`;
				if (arc.endingState) markdown += `**Ending State:** ${arc.endingState}\n\n`;
			}

			// Relationships
			if (options.includeRelationships && character.relationships && character.relationships.length > 0) {
				markdown += '#### Relationships\n\n';

				character.relationships.forEach(rel => {
					markdown += `- **${rel.characterId}** (${rel.type})`;
					if (rel.description) {
						markdown += `: ${rel.description}`;
					}
					if (rel.status) {
						markdown += ` [${rel.status}]`;
					}
					markdown += '\n';
				});

				markdown += '\n';
			}

			// Appearances
			if (options.includeAppearances && character.appearances && character.appearances.length > 0) {
				markdown += `**Scene Appearances:** ${character.appearances.length}\n\n`;
			}

			// Tags
			if (character.tags && character.tags.length > 0) {
				markdown += `**Tags:** ${character.tags.map(t => `#${t}`).join(', ')}\n\n`;
			}

			markdown += '---\n\n';
		});

		return markdown;
	}

	/**
	 * Export characters to CSV
	 */
	async exportToCSV(options: CharacterExportOptions): Promise<string> {
		const characters = this.getFilteredCharacters(options);
		let csv = '';

		// Header
		const headers = [
			'Name',
			'Role',
			'Importance',
			'Tagline',
			'Summary',
			'Age',
			'Gender',
			'Occupation',
			'Traits',
			'Goal',
			'Motivation',
			'Appearances',
			'Tags'
		];

		csv += headers.join(',') + '\n';

		// Data rows
		characters.forEach(character => {
			const row = [
				this.csvEscape(character.name),
				this.csvEscape(character.role),
				this.csvEscape(character.importance),
				this.csvEscape(character.tagline || ''),
				this.csvEscape(character.summary || ''),
				this.csvEscape(character.appearance?.age || ''),
				this.csvEscape(character.appearance?.gender || ''),
				this.csvEscape(character.background?.occupation || ''),
				this.csvEscape(character.personality?.traits?.join('; ') || ''),
				this.csvEscape(character.arc?.goal || ''),
				this.csvEscape(character.arc?.motivation || ''),
				character.appearances?.length?.toString() || '0',
				this.csvEscape(character.tags?.map(t => `#${t}`).join('; ') || '')
			];

			csv += row.join(',') + '\n';
		});

		return csv;
	}

	/**
	 * Export characters to JSON
	 */
	async exportToJSON(options: CharacterExportOptions): Promise<string> {
		const characters = this.getFilteredCharacters(options);

		const exportData = {
			metadata: {
				exportDate: new Date().toISOString(),
				totalCharacters: characters.length,
				statistics: this.manager.getStatistics()
			},
			characters: characters,
			options: options
		};

		return JSON.stringify(exportData, null, 2);
	}

	/**
	 * Save export to file
	 */
	async saveExport(
		content: string,
		format: 'markdown' | 'csv' | 'json',
		baseFilename: string = 'characters_export'
	): Promise<void> {
		try {
			const extension = format === 'json' ? 'json' : format === 'csv' ? 'csv' : 'md';
			const filename = `${baseFilename}.${extension}`;

			// Get active file's directory or use root
			const activeFile = this.app.workspace.getActiveFile();
			const exportPath = activeFile?.parent?.path
				? `${activeFile.parent.path}/${filename}`
				: filename;

			// Check if file exists
			const existingFile = this.app.vault.getAbstractFileByPath(exportPath);
			if (existingFile instanceof TFile) {
				// Overwrite existing file
				await this.app.vault.modify(existingFile, content);
			} else {
				// Create new file
				await this.app.vault.create(exportPath, content);
			}

			new Notice(`Characters exported to ${filename}`);
		} catch (error) {
			console.error('Failed to save character export:', error);
			new Notice('Failed to export characters');
		}
	}

	/**
	 * Get filtered characters based on export options
	 */
	private getFilteredCharacters(options: CharacterExportOptions): Character[] {
		let characters = this.manager.getAllCharacters();

		// Sort
		if (options.groupBy === 'alphabetical') {
			characters = this.manager.sortCharacters(characters, 'name');
		} else if (options.groupBy === 'role') {
			characters = this.manager.sortCharacters(characters, 'role');
		} else if (options.groupBy === 'importance') {
			characters = this.manager.sortCharacters(characters, 'importance');
		}

		return characters;
	}

	/**
	 * Group characters by specified criteria
	 */
	private groupCharacters(
		characters: Character[],
		groupBy?: 'role' | 'importance' | 'alphabetical' | 'none'
	): Record<string, Character[]> {
		if (!groupBy || groupBy === 'none') {
			return { 'All Characters': characters };
		}

		const groups: Record<string, Character[]> = {};

		characters.forEach(character => {
			let groupKey: string;

			switch (groupBy) {
				case 'role':
					groupKey = character.role;
					break;

				case 'importance':
					groupKey = character.importance;
					break;

				case 'alphabetical':
					groupKey = character.name[0].toUpperCase();
					break;

				default:
					groupKey = 'All Characters';
			}

			if (!groups[groupKey]) {
				groups[groupKey] = [];
			}

			groups[groupKey].push(character);
		});

		return groups;
	}

	/**
	 * Escape CSV value
	 */
	private csvEscape(value: string): string {
		if (!value) return '""';

		// Escape quotes and wrap in quotes if contains comma, quote, or newline
		if (value.includes(',') || value.includes('"') || value.includes('\n')) {
			return `"${value.replace(/"/g, '""')}"`;
		}

		return `"${value}"`;
	}
}
