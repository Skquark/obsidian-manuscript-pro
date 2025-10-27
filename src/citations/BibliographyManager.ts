/**
 * Bibliography Manager
 * Discovers, loads, and caches bibliography files
 */

import { TFile, TFolder } from 'obsidian';
import { BibTeXParser, BibEntry } from './BibTeXParser';
import type LatexPandocConcealerPlugin from '../main';

// Re-export BibEntry for use in other modules
export type { BibEntry } from './BibTeXParser';

export class BibliographyManager {
	private plugin: LatexPandocConcealerPlugin;
	private parser: BibTeXParser;
	private entries: Map<string, BibEntry> = new Map();
	private bibFiles: string[] = [];
	private lastLoaded = 0;
	private cacheTimeout = 60000; // 1 minute
	private readonly MAX_CACHE_ENTRIES = 10000; // Prevent unbounded memory growth

	constructor(plugin: LatexPandocConcealerPlugin) {
		this.plugin = plugin;
		this.parser = new BibTeXParser();
	}

	/**
	 * Discover bibliography files for the given markdown file
	 */
	async discoverBibliography(file: TFile): Promise<string[]> {
		const bibPaths: string[] = [];

		// 1. Check YAML frontmatter
		const frontmatter = this.plugin.app.metadataCache.getFileCache(file)?.frontmatter;
		if (frontmatter?.bibliography) {
			const bibField = frontmatter.bibliography;

			if (typeof bibField === 'string') {
				bibPaths.push(bibField);
			} else if (Array.isArray(bibField)) {
				bibPaths.push(...bibField);
			}
		}

		// 2. Check user-configured paths in settings
		if (this.plugin.settings.citations.bibliographyPaths) {
			bibPaths.push(...this.plugin.settings.citations.bibliographyPaths);
		}

		// 3. Search current folder for .bib files
		const folder = file.parent;
		if (folder) {
			const bibFilesInFolder = await this.findBibFilesInFolder(folder);
			bibPaths.push(...bibFilesInFolder);
		}

		// 4. Search vault root for common .bib file names
		const commonNames = ['references.bib', 'bibliography.bib', 'library.bib'];
		for (const name of commonNames) {
			const bibFile = this.plugin.app.vault.getAbstractFileByPath(name);
			if (bibFile instanceof TFile) {
				bibPaths.push(bibFile.path);
			}
		}

		// Remove duplicates and resolve paths
		const uniquePaths = [...new Set(bibPaths)];
		const resolvedPaths: string[] = [];

		for (const path of uniquePaths) {
			const resolved = await this.resolvePath(path, file);
			if (resolved) {
				resolvedPaths.push(resolved);
			}
		}

		return resolvedPaths;
	}

	/**
	 * Find .bib files in a folder
	 */
	private async findBibFilesInFolder(folder: TFolder): Promise<string[]> {
		const bibFiles: string[] = [];

		for (const child of folder.children) {
			if (child instanceof TFile && child.extension === 'bib') {
				bibFiles.push(child.path);
			}
		}

		return bibFiles;
	}

	/**
	 * Resolve bibliography path (handle relative paths)
	 */
	private async resolvePath(path: string, contextFile: TFile): Promise<string | null> {
		// Try absolute path first
		let file = this.plugin.app.vault.getAbstractFileByPath(path);
		if (file instanceof TFile) {
			return file.path;
		}

		// Try relative to context file
		const contextFolder = contextFile.parent;
		if (contextFolder) {
			const relativePath = `${contextFolder.path}/${path}`;
			file = this.plugin.app.vault.getAbstractFileByPath(relativePath);
			if (file instanceof TFile) {
				return file.path;
			}
		}

		// Try vault root
		file = this.plugin.app.vault.getAbstractFileByPath(`/${path}`);
		if (file instanceof TFile) {
			return file.path;
		}

		return null;
	}

	/**
	 * Load bibliography files
	 */
	async loadBibliography(files: string[]): Promise<void> {
		// Check if we need to reload
		if (!this.shouldReload(files)) {
			return;
		}

		this.entries.clear();
		this.bibFiles = files;
		this.lastLoaded = Date.now();

		for (const filePath of files) {
			const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
			if (!(file instanceof TFile)) continue;

			try {
				const content = await this.plugin.app.vault.read(file);
				const parsed = this.parser.parse(content, filePath);

				// Merge entries (with cache size limit)
				parsed.forEach((entry, key) => {
					if (this.entries.size < this.MAX_CACHE_ENTRIES) {
						this.entries.set(key, entry);
					} else if (!this.entries.has(key)) {
						console.warn(`Bibliography cache limit reached (${this.MAX_CACHE_ENTRIES}). Skipping new entry: ${key}`);
					} else {
						// Update existing entry even at limit
						this.entries.set(key, entry);
					}
				});

				if (this.plugin.settings.debugMode) {
					console.log(`Loaded ${parsed.size} entries from ${filePath}`);
				}
			} catch (error) {
				console.error(`Failed to parse bibliography file ${filePath}:`, error);
			}
		}

		if (this.plugin.settings.debugMode) {
			console.log(`Total entries loaded: ${this.entries.size}`);
		}
	}

	/**
	 * Check if bibliography should be reloaded
	 */
	private shouldReload(files: string[]): boolean {
		// Different files
		if (JSON.stringify(files.sort()) !== JSON.stringify(this.bibFiles.sort())) {
			return true;
		}

		// Cache expired
		if (Date.now() - this.lastLoaded > this.cacheTimeout) {
			return true;
		}

		return false;
	}

	/**
	 * Get citation entry by key
	 */
	getCitation(key: string): BibEntry | undefined {
		return this.entries.get(key);
	}

	/**
	 * Get all citation entries
	 */
	getAllCitations(): Map<string, BibEntry> {
		return this.entries;
	}

	/**
	 * Generate a BibTeX string for a single entry
	 */
	toBibTeX(entry: BibEntry): string {
		const fields = entry.fields instanceof Map ? entry.fields : new Map(Object.entries(entry.fields as any));
		const lines: string[] = [];
		lines.push(`@${entry.type}{${entry.key},`);
		fields.forEach((value: string, key: string) => {
			const escaped = (value ?? '').toString().replace(/[{}]/g, '\\$&');
			lines.push(`  ${key} = {${escaped}},`);
		});
		lines.push('}');
		return lines.join('\n');
	}

	/**
	 * Check if citation key exists
	 */
	hasCitation(key: string): boolean {
		return this.entries.has(key);
	}

	/**
	 * Search citations by text
	 */
	searchCitations(query: string): BibEntry[] {
		const results: BibEntry[] = [];
		const lowerQuery = query.toLowerCase();

		this.entries.forEach((entry) => {
			// Search in key
			if (entry.key.toLowerCase().includes(lowerQuery)) {
				results.push(entry);
				return;
			}

			// Search in title
			const title = entry.fields.get('title')?.toLowerCase();
			if (title && title.includes(lowerQuery)) {
				results.push(entry);
				return;
			}

			// Search in author
			const author = entry.fields.get('author')?.toLowerCase();
			if (author && author.includes(lowerQuery)) {
				results.push(entry);
				return;
			}
		});

		return results;
	}

	/**
	 * Get entries by type
	 */
	getEntriesByType(type: string): BibEntry[] {
		const results: BibEntry[] = [];

		this.entries.forEach((entry) => {
			if (entry.type === type.toLowerCase()) {
				results.push(entry);
			}
		});

		return results;
	}

	/**
	 * Invalidate cache
	 */
	invalidateCache(): void {
		this.lastLoaded = 0;
	}

	/**
	 * Reload bibliography for active file
	 */
	async reloadForActiveFile(): Promise<void> {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) return;

		const bibPaths = await this.discoverBibliography(activeFile);
		await this.loadBibliography(bibPaths);
	}

	/**
	 * Get statistics
	 */
	getStats(): {
		totalEntries: number;
		byType: Record<string, number>;
		filesLoaded: number;
	} {
		const byType: Record<string, number> = {};

		this.entries.forEach((entry) => {
			byType[entry.type] = (byType[entry.type] || 0) + 1;
		});

		return {
			totalEntries: this.entries.size,
			byType,
			filesLoaded: this.bibFiles.length,
		};
	}

	/**
	 * Add or update a bibliography entry
	 */
	addEntry(key: string, entry: BibEntry | any): void {
		// Check cache limit before adding new entries
		if (this.entries.size >= this.MAX_CACHE_ENTRIES && !this.entries.has(key)) {
			console.warn(`Bibliography cache limit reached (${this.MAX_CACHE_ENTRIES}). Cannot add new entry: ${key}`);
			return;
		}

		// If it's a BibEntryEnhanced (from import), convert to BibEntry
		if (!entry.rawEntry) {
			const fields = entry.fields instanceof Map ? entry.fields : new Map(Object.entries(entry.fields));
			const bibEntry: BibEntry = {
				key: entry.key,
				type: entry.type,
				fields,
				rawEntry: '', // Generated entries don't have raw text
				file: '', // Not from a file
				line: 0,
			};
			this.entries.set(key, bibEntry);
		} else {
			this.entries.set(key, entry);
		}
	}

	/**
	 * Remove a bibliography entry
	 */
	removeEntry(key: string): boolean {
		return this.entries.delete(key);
	}

	/**
	 * Save entries to a BibTeX file
	 */
	async saveToBibFile(filePath: string): Promise<void> {
		// Convert entries map to BibTeX format
		const bibTexContent = this.entriesToBibTeX();

		// Write to file
		const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
		if (file instanceof TFile) {
			await this.plugin.app.vault.modify(file, bibTexContent);
		} else {
			// Create new file
			await this.plugin.app.vault.create(filePath, bibTexContent);
		}
	}

	/**
	 * Convert entries to BibTeX format
	 */
	private entriesToBibTeX(): string {
		const lines: string[] = [];

		this.entries.forEach((entry) => {
			lines.push(`@${entry.type}{${entry.key},`);

			// Convert fields - handle both Map and Record
			const fields = entry.fields instanceof Map ? entry.fields : new Map(Object.entries(entry.fields));

			fields.forEach((value: string, key: string) => {
				// Escape special characters in value
				const escapedValue = value.replace(/[{}]/g, '\\$&');
				lines.push(`  ${key} = {${escapedValue}},`);
			});

			lines.push('}');
			lines.push('');
		});

		return lines.join('\n');
	}
}
