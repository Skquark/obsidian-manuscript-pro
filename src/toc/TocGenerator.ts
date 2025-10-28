/**
 * Table of Contents Generator
 * Auto-detects manuscript structure and generates professional ToCs
 */

import { App, TFile, TFolder } from 'obsidian';
import type { TocConfiguration, TocEntry, TocOutput, ManuscriptStructure } from './TocInterfaces';
import type { ManuscriptProject } from '../manuscript/ManuscriptSchema';

export class TocGenerator {
	constructor(private app: App) {}

	/**
	 * Generate ToC from manuscript structure
	 */
	async generate(manuscriptData: ManuscriptProject | null, config: TocConfiguration): Promise<TocOutput> {
		const structure = await this.buildManuscriptStructure(manuscriptData);
		const entries = await this.buildTocEntries(structure, config);
		const markdown = this.renderTocMarkdown(entries, config);

		return {
			markdown,
			entries,
			metadata: {
				totalEntries: this.countEntries(entries),
				maxDepth: this.getMaxDepth(entries),
				generatedAt: Date.now(),
			},
		};
	}

	/**
	 * Build manuscript structure from book manifest or vault files
	 */
	private async buildManuscriptStructure(manuscriptData: ManuscriptProject | null): Promise<ManuscriptStructure> {
		if (manuscriptData) {
			return this.buildFromManifest(manuscriptData);
		} else {
			return this.buildFromVault();
		}
	}

	/**
	 * Build structure from book-manifest.json
	 */
	private async buildFromManifest(manuscriptData: ManuscriptProject): Promise<ManuscriptStructure> {
		const structure: ManuscriptStructure = {
			chapters: [],
		};

		// Front matter
		if (manuscriptData.frontmatter && manuscriptData.frontmatter.length > 0) {
			structure.frontMatter = [];
			for (const item of manuscriptData.frontmatter) {
				if (item.file) {
					structure.frontMatter.push({
						title: item.title || this.extractTitleFromFilename(item.file),
						filePath: item.file,
					});
				}
			}
		}

		// Main matter (chapters)
		if (manuscriptData.mainmatter && manuscriptData.mainmatter.length > 0) {
			structure.chapters = [];
			for (const chapter of manuscriptData.mainmatter) {
				const file = this.app.vault.getAbstractFileByPath(chapter.file);
				if (file instanceof TFile) {
					const headings = await this.extractHeadings(file);
					structure.chapters.push({
						title: chapter.title || this.extractTitleFromFilename(chapter.file),
						filePath: chapter.file,
						headings,
					});
				}
			}
		}

		// Back matter
		if (manuscriptData.backmatter && manuscriptData.backmatter.length > 0) {
			structure.backMatter = [];
			for (const item of manuscriptData.backmatter) {
				if (item.file) {
					structure.backMatter.push({
						title: item.title || this.extractTitleFromFilename(item.file),
						filePath: item.file,
					});
				}
			}
		}

		return structure;
	}

	/**
	 * Build structure from vault files (fallback when no manifest)
	 */
	private async buildFromVault(): Promise<ManuscriptStructure> {
		const structure: ManuscriptStructure = {
			chapters: [],
		};

		// Find all markdown files in vault
		const files = this.app.vault.getMarkdownFiles();

		// Sort by path (simple heuristic)
		const sortedFiles = files.sort((a, b) => a.path.localeCompare(b.path));

		for (const file of sortedFiles) {
			const headings = await this.extractHeadings(file);
			structure.chapters!.push({
				title: this.extractTitleFromFilename(file.path),
				filePath: file.path,
				headings,
			});
		}

		return structure;
	}

	/**
	 * Extract headings from a file
	 */
	private async extractHeadings(file: TFile): Promise<{ text: string; level: number }[]> {
		const content = await this.app.vault.read(file);
		const headings: { text: string; level: number }[] = [];

		// Remove frontmatter
		const withoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '');

		// Extract headings
		const lines = withoutFrontmatter.split('\n');
		for (const line of lines) {
			const match = line.match(/^(#{1,6})\s+(.+)$/);
			if (match) {
				const level = match[1].length;
				const text = match[2].trim();
				headings.push({ text, level });
			}
		}

		return headings;
	}

	/**
	 * Extract title from filename
	 */
	private extractTitleFromFilename(path: string): string {
		const filename = path.split('/').pop() || path;
		const withoutExtension = filename.replace(/\.md$/, '');

		// Remove common prefixes like "01-", "Chapter-1-", etc.
		const withoutPrefixes = withoutExtension.replace(/^\d+[-_\s]*/, '').replace(/^Chapter[-_\s]*\d+[-_\s]*/i, '');

		// Convert hyphens and underscores to spaces
		const spaced = withoutPrefixes.replace(/[-_]/g, ' ');

		// Capitalize first letter of each word
		return spaced.replace(/\b\w/g, (c) => c.toUpperCase());
	}

	/**
	 * Build ToC entries from manuscript structure
	 */
	private async buildTocEntries(structure: ManuscriptStructure, config: TocConfiguration): Promise<TocEntry[]> {
		const entries: TocEntry[] = [];

		// Front matter
		if (config.includeFrontMatter && structure.frontMatter) {
			for (const item of structure.frontMatter) {
				entries.push({
					title: item.title,
					level: 1,
					filePath: item.filePath,
				});
			}
		}

		// Parts and chapters
		if (structure.parts) {
			for (const part of structure.parts) {
				if (config.includePartDividers) {
					entries.push({
						title: part.title,
						level: 0, // Part level
						children: [],
					});
				}

				for (const chapter of part.chapters) {
					const chapterEntry = this.buildChapterEntry(chapter, config);
					if (config.includePartDividers) {
						entries[entries.length - 1].children!.push(chapterEntry);
					} else {
						entries.push(chapterEntry);
					}
				}
			}
		} else if (structure.chapters) {
			for (const chapter of structure.chapters) {
				entries.push(this.buildChapterEntry(chapter, config));
			}
		}

		// Back matter
		if (config.includeBackMatter && structure.backMatter) {
			for (const item of structure.backMatter) {
				entries.push({
					title: item.title,
					level: 1,
					filePath: item.filePath,
				});
			}
		}

		return entries;
	}

	/**
	 * Build a single chapter entry with nested headings
	 */
	private buildChapterEntry(
		chapter: { title: string; filePath: string; headings?: { text: string; level: number }[] },
		config: TocConfiguration,
	): TocEntry {
		const entry: TocEntry = {
			title: chapter.title,
			level: 1,
			filePath: chapter.filePath,
			children: [],
		};

		// Add nested headings if configured
		if (config.includeDepth > 1 && chapter.headings) {
			for (const heading of chapter.headings) {
				// Skip H1 (usually the chapter title itself)
				if (heading.level === 1) continue;

				// Only include headings up to configured depth
				// H2 = level 2, H3 = level 3, etc.
				if (heading.level <= config.includeDepth) {
					entry.children!.push({
						title: heading.text,
						level: heading.level,
						filePath: chapter.filePath,
					});
				}
			}
		}

		return entry;
	}

	/**
	 * Render ToC as markdown
	 */
	private renderTocMarkdown(entries: TocEntry[], config: TocConfiguration): string {
		let markdown = '# Table of Contents\n\n';
		let chapterNumber = 0;
		let frontMatterNumber = 0;

		for (const entry of entries) {
			markdown += this.renderEntry(entry, config, { chapterNumber, frontMatterNumber });
			chapterNumber++;
		}

		return markdown;
	}

	/**
	 * Render a single ToC entry
	 */
	private renderEntry(
		entry: TocEntry,
		config: TocConfiguration,
		counters: { chapterNumber: number; frontMatterNumber: number },
	): string {
		let line = '';
		const indent = config.indentSublevels ? '  '.repeat(Math.max(0, entry.level - 1)) : '';

		// Part divider
		if (entry.level === 0) {
			line += `\n**${entry.title}**\n\n`;
			if (entry.children) {
				let partChapterNum = 0;
				for (const child of entry.children) {
					partChapterNum++;
					line += this.renderEntry(child, config, { chapterNumber: partChapterNum, frontMatterNumber: 0 });
				}
			}
			return line;
		}

		// Numbering
		let prefix = '';
		if (entry.level === 1 && config.numberChapters) {
			if (config.useRomanNumerals && counters.chapterNumber === 0) {
				// Front matter uses roman numerals
				prefix = this.toRomanNumeral(++counters.frontMatterNumber) + '. ';
			} else if (config.chapterPrefix) {
				prefix = `${config.chapterPrefix} ${counters.chapterNumber}. `;
			} else {
				prefix = `${counters.chapterNumber}. `;
			}
		} else if (entry.level > 1 && config.numberSections) {
			prefix = `${counters.chapterNumber}.${entry.level - 1} `;
		}

		// Title (with hyperlink if configured)
		let title = entry.title;
		if (config.createHyperlinks && entry.filePath) {
			title = `[${entry.title}](${entry.filePath})`;
		}

		// Leader dots
		let leader = '';
		if (config.useLeaderDots && config.showPageNumbers) {
			leader = ' ';
		}

		// Page number
		let pageNum = '';
		if (config.showPageNumbers) {
			pageNum = entry.pageNumber ? ` ${entry.pageNumber}` : ' ___';
		}

		line += `${indent}${prefix}${title}${leader}${pageNum}\n`;

		// Children
		if (entry.children && entry.children.length > 0) {
			for (const child of entry.children) {
				line += this.renderEntry(child, config, counters);
			}
		}

		return line;
	}

	/**
	 * Convert number to Roman numeral
	 */
	private toRomanNumeral(num: number): string {
		const romanNumerals = [
			{ value: 1000, numeral: 'M' },
			{ value: 900, numeral: 'CM' },
			{ value: 500, numeral: 'D' },
			{ value: 400, numeral: 'CD' },
			{ value: 100, numeral: 'C' },
			{ value: 90, numeral: 'XC' },
			{ value: 50, numeral: 'L' },
			{ value: 40, numeral: 'XL' },
			{ value: 10, numeral: 'X' },
			{ value: 9, numeral: 'IX' },
			{ value: 5, numeral: 'V' },
			{ value: 4, numeral: 'IV' },
			{ value: 1, numeral: 'I' },
		];

		let result = '';
		for (const { value, numeral } of romanNumerals) {
			while (num >= value) {
				result += numeral;
				num -= value;
			}
		}
		return result;
	}

	/**
	 * Count total entries
	 */
	private countEntries(entries: TocEntry[]): number {
		let count = entries.length;
		for (const entry of entries) {
			if (entry.children) {
				count += this.countEntries(entry.children);
			}
		}
		return count;
	}

	/**
	 * Get maximum depth
	 */
	private getMaxDepth(entries: TocEntry[], currentDepth = 1): number {
		let maxDepth = currentDepth;
		for (const entry of entries) {
			if (entry.children && entry.children.length > 0) {
				const childDepth = this.getMaxDepth(entry.children, currentDepth + 1);
				maxDepth = Math.max(maxDepth, childDepth);
			}
		}
		return maxDepth;
	}
}
